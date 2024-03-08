function changeleadtoString(lead, client_name, project_name) {
  let resultStrings = [];


    resultStrings.push(`●  Bedrooms: ${lead.selectValues[0]}`)
    resultStrings.push(`●  Condo: ${lead.selectValues[1]}`);
    resultStrings.push(`●  Request: ${lead.selectValues[2]}`);

    const resultStr = resultStrings.join('\n');  

  const result = resultStrings.join('\n');
  const str = `New Lead please Take Note!\n=============================\n\nHello ${client_name}, you have a new lead :\n\n●  Name: ${lead.name}\n●  Contact: https://wa.me/${lead.ph_number}\n●  Email: ${lead.email}\n${resultStr}`;
  return str;
}

module.exports = { changeleadtoString };
