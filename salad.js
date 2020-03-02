const puppeteer = require("puppeteer-core");
const fs = require("fs");
const XLSX = require('XLSX');
//############################## MODIFICATION REQUIRED ##############################################
const URL="https://citysallad.se/uppsala/catering/"
const CHROMEPATH="/mnt/c/Program\ Files\ \(x86\)/Google/Chrome/Application/chrome.exe" //set the path where you have chrome installed
const FILEPATH="salad.xlsx" // path to excel file

//Enter the column names in the excel file
const sum_columns={
    "ramlosa-naturel":"RN",
    "ramlosa-citrus":"RC",
    "ramlosa-granatapple":"RG",
    "coca-cola":"C",
    "coca-cola-zero":"CZ",
    "zingo":"Z",
    "beer":"Ö",
    "01":"NR1",
    "02":"2",
    "03":"3",
    "04":"4",
    "05":"5",
    "06":"6",
    "07":"7",
    "08":"8",
    "09":"9",
    "10":"10",
    "11":"11",
    "12":"12",
}
// Enter the comment column
const concat_columns={
    "other":"Övrigt"
}
// If you have a summation row or similar, enter the specification here and it will be ignored
const ignore_row={column:"Namn",value:"Summa"}

//set deliveryfinformation
const deliveryInformation ={
    tid:"13:37",
    delivery_address:"Saladstreet 1337",
    "first-name":"My firstname",
    "last-name":"My lastname",
    customer:"My company name",
    invoice_reference:"My invoice reference",
    address:"My invoice adress 1337",
    city:"12345 InvoiceCity",
    phone:"1337123456",
    email:"name@domain.com",
    date:"2020-03-14",//want this last because input is wierd because of datepicker
};

//set how many of each salad if no excel file
let salads = {
    "01":0,
    "02":0,
    "03":0,
    "04":0,
    "05":0,
    "06":0,
    "07":0,
    "08":0,
    "09":0,
    "10":0,
    "11":0,
    "12":0
}

//set how many of each beverage if no excel file
let beverages ={
    "ramlosa-naturel":0,
    "ramlosa-citrus":0,
    "ramlosa-granatapple":0,
    "coca-cola":0,
    "coca-cola-zero":0,
    "zingo":0,
    "beer":0
}

//set other information if no excel file
let other={
    "other":""
}


//############################## NO MORE MODIFICATION REQUIRED ##############################################

if(FILEPATH){
    autofillSheet()
}
else{
    fillForm()
}


async function autofillSheet(){
    const wb = XLSX.readFile(FILEPATH)
    const totals ={}
    const orders =XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).filter(order=>order[ignore_row.column] !==ignore_row.value)
    //console.log(orders) // orders that will be read
    Object.entries(sum_columns).forEach(([key,columnName])=>{
        const reducer = (accumulator, currentValue) => accumulator + numericValueOfCell(currentValue[columnName]);
        totals[key] = orders.reduce(reducer,0)
    })
    Object.entries(concat_columns).forEach(([key,columnName])=>{
        const reducer = (accumulator, currentValue) => {
            let val =stringValueOfCell(currentValue[columnName])
            val  = val ? val  + "\n" : "";
            return accumulator + val
        };
        console.log(key)
        totals[key]=orders.reduce(reducer,"")
    })
    copyExisting(totals,beverages)
    copyExisting(totals,salads)
    copyExisting(totals,other)
    console.log(totals)
    await fillForm()
}
function stringValueOfCell(val){
    if(typeof(val)=== "string"){
        return val.trim()
    }
    else{
        return null
    }
}
function copyExisting(fromObject,toObject){
    Object.entries(fromObject).forEach(([key,val]) => key in toObject? toObject[key] = val : null)
}
function numericValueOfCell(val){
    if(typeof(val) === "number"){
        return val > 0 ? val : 0
    }
    else if(typeof(val) === "string"){
        return val.trim() ? 1: 0
    }
    else{
      return val ? 1 : 0
    }
}

async function fillForm(){
    const checkboxes = ["bread-butter"]
    const radiobuttons=["invoice"]
    const browser = await puppeteer.launch({headless: false, executablePath: CHROMEPATH});
    const page = await browser.newPage();
    //set delivery and incoice information

    await page.goto(URL);
    //await clickElements(page,[].concat(checkboxes,radiobuttons))
    await fillSalads(page,salads)
    await fillFormFields(page,beverages)
    await fillFormFields(page,other)
    await fillFormFields(page,deliveryInformation)// want to insert the deliveryinformation last because of datepicker, no special case fixed
}
async function fillSalads(page,salads) {
    let saladInputs = await page.$$("input.salad_amount");
    for (let i = 0; i < saladInputs.length; i++) {
        // wait for the promise to resolve before advancing the for loop
        const nr =i+1
        const nrstr = (nr <10 ? "0" : "") + nr
        await fillSalad(saladInputs[i],salads[nrstr]);
    }
}
async function fillSalad(element,index) {
    await element.click({clickCount: 3});
    await element.press("Backspace"); 
    await element.type(index + ""); // Types instantly
}
async function fillFormFields(page,keyval){
    const entries =Object.entries(keyval);
    for (let i = 0; i < entries.length; i++) {
        const [key,val] = entries[i]
        const textfield =await page.$("#"+key)
        await textfield.type(val +"")
    }
}
async function clickElements(page,keys){
    // not working properly
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const childinput = await page.$("#"+key); // Element
        const parent = (await childinput.$x(".."))[0]; // Element Parent
        parent.click()
        //await page.$eval("#"+key, elem => elem.click())
    }
}