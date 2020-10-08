const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
 

app.use(bodyParser.urlencoded());

app.use(bodyParser.json());
 

function getRef(){
return "REF001";
}

app.use(cors({origin: true}));
app.use((req, res, next) => {
    getID().then(id => {
        req.id = id;       
        next();
    }, err => {
        console.log('an error happened getting id');
        res.send({code: '06', data: {message: err}});
    });
});

var serviceAccount = require("./perm.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://q-me-d3d47..firebaseio.com"
});
const db = admin.firestore();





async function  getSpecificRecord(id){
    var dataS= {};
    const citiesRef = db.collection('customers').where('id', '==', id);
        const snapshot = await citiesRef.get();
        if (snapshot.empty) {
        console.log('No matching documents.');
        return;
        }  

snapshot.forEach(doc => {
  console.log(doc.id, '=>', doc.data());
  dataS = doc.data;
});
return dataS;

}
async function getID() {
    const citiesRef = db.collection('customers');
    const snapshot = await citiesRef.get();
    if (snapshot.empty) {
        console.log('No matching documents.');
        return;
    }
    
    return snapshot.size +1;
}


var lineNum;
app.post('/api/queue-now', (req, res) => {
    lineNum++;  
    (async () => {
        try {
            var  s1  = req.body.businessName.toString();
            s1=s1.substring(0,1);
            
            var s2 =req.id.toString();
           var responseData={
                refNumber:s1+s2,
                lineNumber:s2
            }         

 
          await db.collection('customers').doc('/' + req.id  + '/')
              .create({
                businessID: req.body.businessID,
                userID: req.body.userID,
                businessName: req.body.businessName,
                refNumber:responseData.refNumber
            });

            
            
          return res.json(responseData);
        } catch (error) {
          console.log(error);
          return res.status(500).send(error);
        }
      })();
  });
  
  app.post('/api/next-online', (req, res) => {
    lineNum++;
    (async () => {
        try {
            const dat = await db.collection('DummyCust').add({
                id:req.id,
                businessID:  req.body.businessID ,
                customerID:  req.body.customerID ,
                refNumber:   req.body.refNumber 

            });
            console.log('Added document with ID: ', dat.id);
            return res.send(dat);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});
var numnerLn = 0;
//read with id 
app.get('/api/read/:id', (req, res) => {
    //console.log('---ref number--', req.ref);
        var num = 0;
        (async () => {
            try {
                let query = db.collection('customers');
                let response = [];
                await query.get().then(querySnapshot => {
                    let docs = querySnapshot.docs;
                    for (let doc of docs) {
                        const selectedItem = {
                            id: doc.id,
                            customer: doc.data().item
                        };
                        response.push(selectedItem);
                    }
                });
                return res.status(200).send(response);
            } catch (error) {
                console.log(error);
                return res.status(500).send(error);
            }
        })();
    });
// read all
app.get('/api/read', (req, res) => {
//console.log('---ref number--', req.ref);
    var num = 0;
    (async () => {
        try {
            let query = db.collection('customers');
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        id: doc.id,
                        customer: doc.data().item
                    };
                    response.push(selectedItem);
                }
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});
// get count for the que using q id 
app.get('/api/get-next-person/:qid', (req, res) => {
            try {
                 db.collection('customers').where('businessID', '==', req.params.qid).get().then(querySnapshot => {
                    let docs = querySnapshot.docs;
                    const ids = docs.map(e => parseInt(e.id));
                    const minId = Math.min.apply(Math, ids);
                    const doc = docs.filter(e => (parseInt(e.id) == minId)).shift();
                    if(doc){
                        res.send(doc.data());
                    }else{
                        return res.status(500).send("No person next");
                    }
                });
            } catch (error) {
                return res.status(500).send(error);
            }
    });


app.get('/api/get-queue-item/:item_id', (req, res) => {
    var lineLen = 0;
    (async () => {
        try {
            const document = db.collection('customers').doc(req.params.item_id);
            let customer = await document.get();
            let response = customer.data();
            console.log("-----Response Data------",response);

            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});
// update
app.put('/api/update/:item_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('customers').doc(req.params.item_id);
            await document.update({
                customer: req.body.customer
            });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});
// delete
app.delete('/api/delete/:item_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('customers').doc(req.params.item_id);
            await document.delete();
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

app.get('/api/other/:item_id', (req, res) => {
    doWork(123, function(err, results){
        if(err){
             res.status(500).send(err);
        }else{
            res.send(results);
        } 
    });
});

function doWork(param1, callback){
    callback('null', {code:'00', data:{}});
}

var port = 8088;
app.listen(port, () => {
    console.log('SERVER STARTED on '+port.toString());
});