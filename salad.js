const puppeteer = require("puppeteer-core");
const fs = require("fs");
const papa = require("papaparse");
//############################## MODIFICATION REQUIRED ##############################################
const URL="https://citysallad.se/uppsala/catering/"
const CHROMEPATH="/mnt/c/Program\ Files\ \(x86\)/Google/Chrome/Application/chrome.exe" //set the path where you have chrome installed
const FILEPATH="salads.csv" // path to CSV FILE


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

//set how many of each salad
const salads = {
    "01":1,
    "02":0,
    "03":1,
    "04":0,
    "05":1,
    "06":0,
    "07":1,
    "08":0,
    "09":1,
    "10":0,
    "11":1,
    "12":0
}

//set how many of each beverage
const beverages ={
    "ramlosa-naturel":1,
    "ramlosa-citrus":0,
    "ramlosa-granatapple":1,
    "coca-cola":0,
    "coca-cola-zero":1,
    "zingo":1,
    "beer":0
}

//set other information
const other={
    "other":"Övrig information"
}

//############################## NO MORE MODIFICATION REQUIRED ##############################################

autofill()

function autofill(){
    fs.stat(FILEPATH, function(err, stat) {
        if(err == null) {
            const file = fs.createReadStream(FILEPATH);
            papa.parse(file, {
                worker: true, // Don"t bog down the main thread if its a big file
                step: function(result) {
                   console.log("TODO: PREFILL SALAD HERE")
                },
                complete: function(results, file) {
                    fillForm()
                }
            });
        } else if(err.code === 'ENOENT') {
            // file does not exist
            console.warn("file does not exist")
            fillForm()
        } else {
            console.warn('Some other error with file: ', err.code);
        }
    });
   
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