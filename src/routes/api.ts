// Libraries
import { Request, Response, Router } from 'express';
import { OK, UNPROCESSABLE_ENTITY, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import jsonfile from 'jsonfile';

// Helpers
import { ParamMissingError } from '@shared/errors';

// Models
import { ICurrentStock } from '@models/current-stock-model';
import { ITransaction } from '@models/transaction-model';
import { IStock } from '@models/stock-model';

// Data
const transactionsPath = 'src/repos/transactions.json';
const stockPath = 'src/repos/stock.json';

// Export the base-router
const router = Router();

// Setup routers
router.get('/currentStock', async (_: Request, res: Response) => {
    let sku = _.query.sku;
    if (!sku || typeof sku !== 'string') {
        throw new ParamMissingError();
    }
    
    getCurrentStockLevel(sku).then((currentStock: ICurrentStock) => {
        
        return res.status(OK).json(currentStock);
    }).catch((error: Error) => {
        return res.status(INTERNAL_SERVER_ERROR).send({
            message: error.message
        })
    })
});

async function getCurrentStockLevel(sku: string): Promise<ICurrentStock> {
    return new Promise((resolve, reject) => {
        try {
            let Stocks = jsonfile.readFileSync(stockPath);
            let stockFound = false
    
            let currentStock: IStock = Stocks.find((stock: IStock) => stock.sku === sku)
            
            if (!currentStock) {
                stockFound =false
                currentStock = {
                    sku: sku,
                    stock: 0
                }
            }
    
            let transactionData = jsonfile.readFileSync(transactionsPath)
            let transactions = transactionData.filter((t: ITransaction) => t.sku == sku)
            
            if (!stockFound && !transactions.length) {
                return reject(Error('Sku not found'))
            }
    
            transactions.forEach((transaction: ITransaction)=>{
                if (transaction.type === 'refund') {
                    currentStock.stock = currentStock.stock + transaction.qty
                } else {
                    currentStock.stock = currentStock.stock - transaction.qty
                }
            })
    
            return resolve({
                sku: sku,
                qty: currentStock.stock
            })
            
        } catch (error) {
            console.log(error)
            return reject(Error('Internal server error'))
        }
    })
}
// *** Export default **** //

export default router;
