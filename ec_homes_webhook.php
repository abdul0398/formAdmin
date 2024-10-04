<?php

// Connect to the SQLite database
try {
    $db = new PDO('mysql:host=localhost;dbname=dbmudbaf00gr1e', 'uhjdojqel1xrp', '3yfrehsrblkl');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error: " . $e->getMessage());
} 



if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Open the file to append data
    $commonData = array();
    $additional_data = array();
    $name = '';
    $mobile_number = '';
    $email = '';
    $source_url = 'https://no1-ec-homes.homes/';
    $webhook_data = array(
        'source_url' => "https://no1-ec-homes.homes/",
        'client_id' => null,
        'project_id' => null,
        'ip_address' => null,
        "email" => '',
        'ph_number' => '',
    );
    $commonData = array(
        "name" => $_POST['Name'] ?? '',
        "mobile_number" => $_POST['Contact'] ?? '',
        "email" => $_POST['Email'] ?? '',
        "source_url" => 'https://no1-ec-homes.homes/',
    );
  
    $data = "New Lead Please take note! New Lead Please take note! " . PHP_EOL;
    $data .= "Jome Official, you have a new lead:". PHP_EOL;
    $data .= "- Source Url: https://no1-ec-homes.homes/ " . PHP_EOL;

    // Loop through all POST data
    foreach ($_POST as $key => $value) {
        if($key == 'Name'){
            $data .= '- '.ucfirst($key) . ": " . $value . PHP_EOL;
            $webhook_data['firstname'] = $value ?? '';
        }
        if($key == 'Email'){
            $data .= '- '.ucfirst($key) . ": " . $value . PHP_EOL;
            $webhook_data['email'] = $value ?? '';
        }
        if($key == 'Contact'){
            $data .= '- '.ucfirst($key) . ": https://wa.me/+65" . $value . PHP_EOL;
            $webhook_data['ph_number'] = $value ?? '';
        }
        
        if($key == 'What_are_you_facing_at_the_moment_as_a_home_owner?'){
            $additional_data[] = array(
                "key" => str_replace("_"," ",$key),
                "value" => $value
            );
            $data .= '- '.ucfirst(str_replace('_',' ',$key)) . ": " . $value . PHP_EOL;
        }
        if($key == 'What_are_the_project_you\'re_interested_to_find_out?') {
            $additional_data[] = array(
                "key" => str_replace("_"," ",$key),
                "value" => $value
            );
            $data .= '- '.ucfirst(str_replace('_',' ',$key)) . ": " . $value . PHP_EOL;
        }
        if($key == 'Req_Info') {
            $additional_data[] = array(
                "key" => str_replace("_"," ",$key),
                "value" => $value
            );
            $data .= '- '. $value . PHP_EOL;
        }
        if($key == 'form_type') {
            $additional_data[] = array(
                "key" => str_replace("_"," ",$key),
                "value" => $value
            );
            $data .= '- '.ucfirst(str_replace('_',' ',$key)) . ": " . $value . PHP_EOL;
        }
        
    }
    
    
    
    
   

    $is_discord = 1;
    $webhook_data['is_send_discord'] = 1;
    $webhook_data['status'] = 'clear';
    if (isset($_POST['Email'])) {
        $check_email = $_POST['Email'] ?? '';
        // Validate and sanitize the email input
        $check_email = filter_var($check_email, FILTER_SANITIZE_EMAIL);
        $checkJunkEmail = check_junk_db($db,'email',$check_email);
        $checkDuplicateEmail = check_email($db,$check_email,$source_url);

        if($checkJunkEmail > 0){
            $is_discord = 0;
            $webhook_data['status'] = 'junk';
            $webhook_data['is_send_discord'] = 0;
        }
        if($checkDuplicateEmail > 0){
            $is_discord = 0;
            $webhook_data['status'] = 'junk';
            $webhook_data['is_send_discord'] = 0;
        }
 
    }  

    if (isset($_POST['Contact'])) {
        $check_number = $_POST['Contact'] ?? '';
        // Validate and sanitize the email input
        $checkJunkNumber = check_junk_db($db,'phone_number',$check_number);
        $checkDuplicateNumber = check_phone($db,$check_number,$source_url);

        if($checkJunkNumber > 0){
            $is_discord = 0;
            $webhook_data['status'] = 'junk';
            $webhook_data['is_send_discord'] = 0;
        }
        if($checkDuplicateNumber > 0){
            $is_discord = 0;
            $webhook_data['status'] = 'junk';
            $webhook_data['is_send_discord'] = 0;
        }
 
    }  

    $webhook_data['is_verified'] = 0;
    unset($_POST['Name']);
    unset($_POST['Email']);
    unset($_POST['Contact']);

    $commonData['additional_data'] = $additional_data;
    $LeadManagement = $commonData;

    // JSON encode the lead data
    $jsonData = json_encode($LeadManagement); 
    // Check for potential junk content
    $check_junk = checkJunk($jsonData); 
    if (isset($check_junk['Terms']) && !empty($check_junk['Terms']) && count($check_junk['Terms']) > 0) {
        $webhook_data['status'] = 'junk';
        $webhook_data['is_send_discord'] = 0;
        $is_discord = 0;
    }   

     // Merge $_POST data with webhook data
     $webhook_data = array_merge($webhook_data,$_POST); 
    if($is_discord == 1){
        sendDiscordMsg($data);
    }
     // Send data to the endpoint
    sendData($webhook_data);
}


// Function to send data via cURL
function sendData($data)
{
    $curl = curl_init();

    curl_setopt_array($curl, array(
        CURLOPT_URL => 'http://janicez87.sg-host.com/wordpress_endpoint.php',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Authorization: Basic am9tZWpvdXJuZXl3ZWJzaXRlQGdtYWlsLmNvbTpQQCQkd29yZDA5MDIxOGxlYWRzISM='
        ),
        CURLOPT_SSL_VERIFYPEER => false
    ));

    $response = curl_exec($curl);

    curl_close($curl);
    echo $response;
}


function checkJunk($data)
{
    $curl = curl_init();

    curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://jomejourney.cognitiveservices.azure.com/contentmoderator/moderate/v1.0/ProcessText/Screen',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: text/plain',
            'Ocp-Apim-Subscription-Key: 453fe3c404554800bc2c22d7ef681542'
        ),
        CURLOPT_SSL_VERIFYPEER => false
    ));

    $response = curl_exec($curl);
    curl_close($curl);

    return json_decode($response, true);
}


// Define a function to save lead data
function check_email($db, $email, $source_url) {
    $stmt = $db->prepare("SELECT COUNT(*) FROM leads WHERE email = :email AND source_url = :source_url");
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':source_url', $source_url);
    $stmt->execute();

    $count = $stmt->fetchColumn();

    // Check if the email exists
    return $count;
}

function check_phone($db, $check_number, $source_url) {
    $stmt = $db->prepare("SELECT COUNT(*) FROM leads WHERE phone_number = :phone_number AND source_url = :source_url");
    $stmt->bindParam(':phone_number', $check_number);
    $stmt->bindParam(':source_url', $source_url);
    $stmt->execute();

    $count = $stmt->fetchColumn();

    // Check if the email exists
    return $count;
}

function check_junk_db($db,$col,$val) {
    $stmt = $db->prepare("SELECT COUNT(*) FROM leads WHERE $col = :col AND status = :status");
    $stmt->bindParam(':col', $val);
    $status = 'junk'; // Assign 'junk' to a variable
    $stmt->bindParam(':status', $status);
    $stmt->execute();
    $count = $stmt->fetchColumn(); 
    return $count;
}

function sendDiscordMsg($data)
{
    $post_array = array(
        "content" => $data,
        "embeds" => null,
        "attachments" => []
    );

    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://discord.com/api/webhooks/1235775452019167263/2jNgZ7RxO6O-98lINT0jbrT-_BrU1Ssw_vTo-JiWfMJ7ltOZDJlVKO6DB4dqgrsN8DMm',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($post_array),
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Cookie: __dcfduid=8ec71370974011ed9aeb96cee56fe4d4; __sdcfduid=8ec71370974011ed9aeb96cee56fe4d49deabe12bc0fc3d686d23eaa0b49af957ffe68eadec722cff5170d5c750b00ea'
        ),
        CURLOPT_SSL_VERIFYPEER => false
    ));

    $response = curl_exec($curl);
    curl_close($curl);
    echo $response;
}

?>
