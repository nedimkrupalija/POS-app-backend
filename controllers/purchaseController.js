const db = require('../config/db.js');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const Location = db.location
const { generateServerErrorResponse } = require('../utils/messages.js');

const Item = db.item
const Purchase = db.purchase

const VAT = db.vat

async function calculateTotals(items) {
    const itemIds = items.map(item => item.id);

    const itemList = await Item.findAll({
        where: { id: itemIds },
        include: [{ model: VAT }]
    });

    const itemListWithQuantity = itemList.map(item => {
        const selectedItem = items.find(selectedItem => selectedItem.id === item.id);

        if (selectedItem) {
            return { ...item.toJSON(), quantity: selectedItem.quantity };
        }

        return item.toJSON();
    });

    let total = 0, totalVat = 0;

    itemListWithQuantity.forEach(item => {
        const vatRate = item.VAT.percent;
        const itemTotal = item.quantity * item.sellingPrice;
        const itemVat = itemTotal * (vatRate / 100);

        total += itemTotal;
        totalVat += itemVat;
    });

    const grandTotal = total + totalVat;

    return { itemListWithQuantity, total, totalVat, grandTotal };
}

async function createPurchaseOrder(req, res) {
    try {
        const { items, tableId, locationId } = req.body;

        const { itemListWithQuantity, total, totalVat, grandTotal } = await calculateTotals(items);

        console.log(locationId)

        const purchaseOrder = await Purchase.create({
            items: itemListWithQuantity,
            tableId: tableId,
            totals: total,
            vat: totalVat,
            status: 'pending',
            LocationId: locationId,
            grandTotal: grandTotal
        });

        res.status(200).json(purchaseOrder);

    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}


async function getAllPurchaseOrders(req,res){
    try {
        const purchaseOrders = await Purchase.findAll();

        res.status(200).json(purchaseOrders);
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}


async function getPurchaseOrderById(req,res){
    try {
        const purchaseOrder = await Purchase.findByPk(req.params.id);

        if (!purchaseOrder){
            res.status(404).json({ message: 'Purshase order not found' });
        } else {
            res.status(200).json(purchaseOrder);
        }
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}

async function updatePurchaseOrder(req, res) {
    try {
        const { items, tableId } = req.body;

        const { itemListWithQuantity, total, totalVat, grandTotal } = await calculateTotals(items);

        const purchaseOrder = await Purchase.findByPk(req.params.id);

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        await purchaseOrder.update({
            items: itemListWithQuantity,
            tableId: tableId,
            totals: total,
            vat: totalVat,
            status: req.body.status,
            grandTotal: grandTotal
        });

        res.status(200).json(purchaseOrder);

    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}
async function deletePurchaseOrder(req,res){
    try {
        const purchaseOrder = await Purchase.findByPk(req.params.id);

        if (!purchaseOrder) {
            res.status(404).json({ message: 'Purchase not found' });
        } else {
            await purchaseOrder.destroy();

            res.status(200).end()
        }
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}


async function updatePurchaseStatus(req, res) {
    try {
        const purchaseOrder = await Purchase.findByPk(req.params.id);

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        await purchaseOrder.update({
            status: req.body.status
        });

        res.status(200).json(purchaseOrder);

    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}


async function getPurchaseOrderByLocationId(req,res){
    try {
        const purchaseOrders = await Purchase.findAll({
            where: { locationId: req.params.id }
        });

        res.status(200).json(purchaseOrders);
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}

async function createInvoice(req, res) {
    const tableData = req.body.tableData;

    const doc = new PDFDocument();


    function drawHorizontalLine(character) {
        const lineWidth = doc.page.width ; 
  const lineSymbol = "-".repeat(Math.floor(lineWidth / 8));
  doc.text(lineSymbol, { align: 'left' }); 
}
    doc.pipe(res);

    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    res.setHeader('Content-Type', 'application/pdf');const locations = await Location.findByPk(tableData.LocationId);
    console.log(locations['name']);
    
    
    doc.font('Courier')
       .fontSize(10)
       .text(locations['name'], { align: 'center' })
       .moveDown(1);
    
    drawHorizontalLine("-");
    doc.moveDown(2)
    doc.font('Helvetica-Bold')
       .fontSize(20)
       .text('Invoice', { align: 'center' })
      
       doc.font('Courier')
       .fontSize(10)
       .text(`LID: ${tableData.id}`)
       .moveDown(0.5);
       if(tableData.tableId!=null)
   doc.font('Courier')
    .fontSize(10)
    .text("TID: "+tableData.tableId)
    drawHorizontalLine("-");

    let yOffset = 175; 
    tableData.items.forEach(item => {
      const unitPrice  = item.sellingPrice;
      const name=item.name;
      const quantity=item.PurchaseItem.quantity;

      const totalPrice = quantity * unitPrice;
    
      doc.text(name, 75, yOffset);
      yOffset += 10;
      doc.text(quantity.toString()+",00x", 75, yOffset);
      doc.text(unitPrice.toFixed(2), 200, yOffset, { width: 100, align: 'right' });
      doc.text(totalPrice.toFixed(2), 400, yOffset, { width: 100, align: 'right' });
    
      yOffset += 20;
    });
    

    doc.moveDown(1);
    doc.text("",75,yOffset);
    drawHorizontalLine("-");

       doc.moveDown(1).
       font('Courier')
       .text(`Total without VAT: `,75,doc.y, { align: 'left' });
       doc.font('Courier').text(`${tableData.grandTotal-tableData.vat}`,400,doc.y,{align:'right'}).moveDown(1);
       doc.font('Courier')
       .text(`VAT: `,75,doc.y, { align: 'left' });
       doc.font('Courier').text(`${tableData.vat}`,400,doc.y,{align:'right'}).moveDown(1);
       doc.font('Courier')
       .text(`Total: `,75,doc.y,{ align: 'left' });
       doc.font('Courier').text(`${tableData.grandTotal}`,400,doc.y,{align:'right'}).moveDown(1);

    doc.text("",75,doc.y);
    drawHorizontalLine("-");
    doc.moveDown(0.001);
    drawHorizontalLine("-");
    doc.moveDown(1).text("Thank you for your purchase!",{align:'center'}).moveDown(1);
    drawHorizontalLine("-");

    doc.end();
}
module.exports = {createPurchaseOrder,getAllPurchaseOrders,getPurchaseOrderById,updatePurchaseOrder,deletePurchaseOrder, updatePurchaseStatus, getPurchaseOrderByLocationId,createInvoice};
