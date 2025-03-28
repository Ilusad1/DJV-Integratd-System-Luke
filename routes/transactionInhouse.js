var express                             = require("express"),
    mongoose                            = require("mongoose");
    moment                              = require("moment");
    Transaction                         = require("../models/transaction"),
    ItemInformation                     = require("../models/itemInformation"),
    Serial                              = require("../models/serial"),
    Client                              = require("../models/client"),
    router                              = express.Router();

//===============================================================================================================
// index
//===============================================================================================================
// get index
router.get("/transaction/inhouse", function(req, res){
    res.render("transaction/Inhouse/index")
})

// get client list for add transaction
router.post("/transaction/inhouse/create/clientList", async function(req, res){
    var clientList = await Client.find()
        .select('_id Name')
        .lean()

    if (Array.isArray(clientList) && clientList.length > 0) {
        clientList.forEach(function(d){
            tempStr += "<option value='" + d._id + "'>" + d.Name + "</option>"
        });
    } else {
        tempStr = "<option value=''>No Client's</option>";
    }       
    res.send(tempStr)
})

// create inhouse transaction
router.post("/transaction/inhouse/create/ajax",async function(req, res){
  // Convert the string date to a Date object
  req.body.data.RecieveDate = new Date(req.body.data.RecieveDate);
  var newlyCreatedTransaction = await Transaction.create(req.body.data);
  var foundClient = await Client.findById(req.body.data.Client);
  foundClient.Transaction.push(newlyCreatedTransaction._id);
  // Save the updated client information
  await foundClient.save();
  res.send("You have successfuly created a new transaction!" );
})

//universal get all client
router.post("/transaction/inhouse/index/poplate/table", async function(req, res){
    var tableData = await populateTable();
    res.send(tableData);
})

//===============================================================================================================
// view
//===============================================================================================================
// edit inhouse transaction
router.post("/transaction/inhouse/edit",async function(req, res){
    //convet string to date
    req.body.data.data.RecieveDate = new Date(req.body.data.data.RecieveDate)
    await Transaction.findByIdAndUpdate(req.body.data.id,req.body.data.data)
    // populate transaction
    // var transaction = await Transaction.findById(req.body.data.id)
    //     .populate('Client')
    //     .lean()
    res.send('You have successfuly edited a transaction!')
})

// view inhouse transaction
router.get("/transaction/inhouse/view/:id", function(req, res){
    res.render("transaction/inhouse/view")
})

//===============================================================================================================
// Dropdown
//===============================================================================================================
// add image
router.post("/transaction/inhouse/edit/image/add",async function(req, res){
    // find transaction
    var transaction = await Transaction.findById(req.body.data.id)
    // add image to transaction
    transaction.Images.push(req.body.data.data)
    await transaction.save()
    res.send('You have successfuly added an image!')
})

// get all inhouse transaction
router.post("/transaction/inhouse/view/populate/transaction",async function(req, res){
    var transaction = await Transaction.findById(req.body.data.id)
        .populate('Client')
        .populate({
            path: "Billing.Parts",
            model: "serial"
        })
        .lean()
    res.send(transaction)
})

// initial print report
router.get("/transaction/inhouse/view/print/serviceReport/:id", async function(req, res){
    res.render("transaction/inhouse/modal/dropDown/reports/serviceReport")
})

// initial print report of  transaction data
router.post("/transaction/report/serviceReport", async function (req, res) {
    var initialPrint = await Transaction.findById(req.body.data.id)
    .populate('Client')
    .populate({
        path: "Billing.Parts",
        model: "serial"
    })
    .lean()
    res.send(initialPrint)
})

// part 
// release
router.post("/transaction/inhouse/view/release/update", async function(req, res){
    await Transaction.findByIdAndUpdate(req.body.data.id, { Release: req.body.data.data });
    res.send("You have successfuly release date!")
})

//tags

router.post("/transaction/inhouse/view/tags/update", async function(req, res){
    req.body.data.tagsTempList = req.body.data.tagsTempList || [];
    req.body.data.tagsFixedList = req.body.data.tagsFixedList || [];
    await Transaction.findByIdAndUpdate(req.body.data.id, {
        TempStatus: req.body.data.tagsTempList,
        FixedStatus: req.body.data.tagsFixedList
    })
    res.send("You have successfuly upated the tags!")
})

//===============================================================================================================
// Accordion
//===============================================================================================================
// Billing - Parts
//populate list of parts information
router.post("/transaction/inhouse/view/parts/add/partsInfromation/populate", async function(req, res){
    var itemData = await ItemInformation.find().lean()
    res.send(itemData)
})

// Billing - Parts
// populate list of serial base on selected parts information
router.post("/transaction/inhouse/view/parts/add/partsInformation/serial/populate",async function(req, res){
    // update table list (get only Partinformation)
    // transfer only the id
    var partsList = await Serial.find({ "ItemInformation": new mongoose.Types.ObjectId(req.body.data) })
    .lean();
    res.send(partsList)
})

// Billing - Parts
//save serial to transaction
router.post("/transaction/inhouse/view/billing/parts/add", async function(req, res){
    var transaction = await Transaction.findById(
        req.body.data.id,
    );
    transaction.Billing.Parts.push(req.body.data.Parts)
    await transaction.save()
    res.send("You have successfuly add parts!")
})

//billing - parts populate table
router.post("/transaction/inhouse/view/billing/parts/populte/table", async function(req, res){
    var transaction = await Transaction.findById(req.body.data)
        .populate({
            path: "Billing.Parts",
            model: "serial"
        })
        .lean();
    var partsTable = await populateTableBillingParts(transaction.Billing.Parts)
    res.send(partsTable)
})


//billing - Transporation save
router.post("/transaction/inhouse/view/billing/transportation/add", async function(req, res){
    // update transaction data  
    var transaction = await Transaction.findById(req.body.data.id)
    transaction.Billing.Transporation.push(req.body.data.transportation)
    await transaction.save()
    res.send('You have successfuly added a transportation!')
})

//billing - transportation populate table
router.post("/transaction/inhouse/view/billing/transporation/populte/table", async function(req, res){
    var transaction = await Transaction.findById(req.body.data).select("Billing.Transporation").lean()
    var transpoTable = await populateTableBillingTranspo(transaction.Billing.Transporation)
    res.send(transpoTable)
})

//billing - service charge save
router.post("/transaction/inhouse/view/billing/serviceCharge/add", async function(req, res){
    // update transaction data
    var transaction = await Transaction.findById(req.body.data.id)
    transaction.Billing.ServiceCharge.push(req.body.data.ServiceCharge)
    await transaction.save()
    res.send('You have successfuly added a Service Charge!')
})

//billing - service charge populate table
router.post("/transaction/inhouse/view/billing/serviceCharge/populte/table", async function(req, res){
    var transaction = await Transaction.findById(req.body.data).select("Billing.ServiceCharge").lean()
    var scTable = await populateTableBillingServiceCharge(transaction.Billing.ServiceCharge)
    res.send(scTable)
})

//billing - payment save
router.post("/transaction/inhouse/view/billing/payment/add", async function(req, res){
    // update transaction data
    var transaction = await Transaction.findById(req.body.data.id)
    transaction.Billing.Payment.push(req.body.data.Payment)
    await transaction.save()
    res.send('You have successfuly added a Payment!')
})

//billing - payment populate table
router.post("/transaction/inhouse/view/billing/payment/populte/table", async function(req, res){
    // convert date
    var transaction = await Transaction.findById(req.body.data).select("Billing.Payment").lean()
    var payTable = await populateTableBillingPayment(transaction.Billing.Payment)
    res.send(payTable)
})


// notes
router.put("/transaction/inhouse/view/notes", async function(req, res){
    await Transaction.findByIdAndUpdate(req.body.data.id, { Notes: req.body.data.notes });
    res.send("You have successfuly updated notes!")
})

// images edit
router.post("/transaction/inhouse/edit/image/edit",async function(req, res){
    // console.log(req.body.data)

    // find transaction
    var transaction = await Transaction.findById(req.body.data.id)
    // add image to transaction
    // Find the index of the image to be removed
    var imageIndex = transaction.Images.findIndex(function(image){
        image._id.toString() === req.body.data.data._id
    })
    console.log(imageIndex)
    // Remove the image if it exists
    if (imageIndex !== -1) {
        transaction.Images.splice(imageIndex, 1);
        // await transaction.save();
        res.send('You have successfully removed the image!');
    } else {
        res.status(404).send('Image not found!');
    }
    // transaction.Images.push(req.body.data.data)
    // await transaction.save()
    // res.send('You have successfuly added an image!')
})

module.exports = router;

async function populateTable(){
    // tih = transaction in house 
    var tihList = [];
    var transactioninhouseList = await Transaction.find()
        .populate({ path: 'Client', select: 'Name' }) // only retrieve the name field from Client
        .select('_id JobOrder Client Device') // specify the fields you want to retrieve
        .lean();
    // convert data to string
    transactioninhouseList.forEach(function(tih){
        tihList.push([
            "<a href='/transaction/inhouse/view/" + tih._id + "'>" + tih.JobOrder + "</a>",
            "<a href='/client/view/" + tih.Client._id + "'>" + tih.Client.Name + "</a>",
            tih.Device,
            "Php. 1,000.00",
            "Status"
        ]);
    });

    return tihList;
}

async function populateTableBillingParts(partsList){
    var mPartList = []
    
    partsList.forEach(function(part) {
        mPartList.push({
            _id: part._id,
            Description: "<i class='bi bi-pencil-square text-white p-1 px-2 text-white bg-warning rounded tihvbtEdit'></i>\
                        <i class='bi bi-trash text-white p-1 px-2 bg-danger rounded me-2 tihvbtDelete'></i>" + part.Description,
            Serial: part.Serial,
            Price: part.RetailPrice
        });
    });
    return mPartList
}

async function populateTableBillingTranspo(transpo){
    var transpoList = []
    transpo.forEach(function(trans){
        transpoList.push({
            Description: "<i class='bi bi-pencil-square text-white p-1 px-2 text-white bg-warning rounded tihvbtEdit'></i>\
                        <i class='bi bi-trash text-white p-1 px-2 bg-danger rounded me-2 tihvbtDelete'></i>" + trans.Description,
            Quantity: trans.Quantity,
            UnitPrice: trans.UnitPrice,
            Price: trans.Price
        })
    })
    return transpoList
}

async function populateTableBillingServiceCharge(serviceCharge){
    var scList = []
    serviceCharge.forEach(function(sc){
        scList.push({
            Description: "<i class='bi bi-pencil-square text-white p-1 px-2 text-white bg-warning rounded tihvbtEdit'></i>\
                        <i class='bi bi-trash text-white p-1 px-2 bg-danger rounded me-2 tihvbtDelete'></i>" + sc.Description,
            Price: sc.Price
        })
    })
    return scList
}

async function populateTableBillingPayment(payment){
    var payList = []
    payment.forEach(function(pay){
        payList.push({
            Description: "<i class='bi bi-pencil-square text-white p-1 px-2 text-white bg-warning rounded tihvbtEdit'></i>\
                        <i class='bi bi-trash text-white p-1 px-2 bg-danger rounded me-2 tihvbtDelete'></i>" + pay.Description,
            Date: moment(pay.Date).format("MMM-DD-YYYY"),
            Amount: pay.Amount
        })
    })
    return payList
}