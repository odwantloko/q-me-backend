const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
var mail = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'QME2020QFX@gmail.com',
      pass: 'Hack2020qme!'
    }
  });
 



app.use(cors({origin: true}));
app.use((req, res, next) => {
    getID2().then(id => {
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

async function getID2() {
    const citiesRef = db.collection('customers');
    const snapshot = await citiesRef.get();
    if (snapshot.empty) {
        console.log('No matching documents.');
        return 0;
    }
    else{
        let docs = snapshot.docs;
         const ids = docs.map(e => parseInt(e.id));
      const MaxID = Math.max.apply(Math, ids);
      return MaxID +1;

    }
    

    
    
}

var lineNum;
app.post('/api/queue-now', (req, res) => {
    lineNum++;  
    (async () => {
        try {
            var  s1  = req.body.businessName.toString();
            s1=s1.substring(0,1);
          
            var s2 =req.id.toString();
            refN = s1+  ("0000" + s2).slice(-4)

           var responseData={
                refNumber:refN,
                lineNumber:s2
            }         

 
          await db.collection('customers').doc('/' + req.id  + '/')
              .create({
                businessID: req.body.businessID,                 
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
  


//read with id 
app.get('/api/read/:id', (req, res) => {
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

//
app.get('/api/count-per-q/:qid', (req, res) => {

    var num = 0;
    (async () => {
        try {
            let query = db.collection('customers').where('businessID', '==', req.params.qid);
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
            var ln = response.length;
            var  AWT = minutesToHHMM(15*ln,true);
            
        var responseData = {
            numberOfPeople:response.length,
             AWT : AWT
        }
            
             res.status(200).send(responseData);
        } catch (error) {
            console.log(error);
             res.status(500).send(error);
        }
    })();
});
//

// function for AWT
function minutesToHHMM (mins, twentyFour = false) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    m = m < 10 ?  + m : m;
  
    if (twentyFour) {
      h = h < 10 ?  + h : h;
      return `${h} hour ${m} min`;
    } else {
      let a = 'am';
      if (h >= 12) a = 'pm';
      if (h > 12) h = h - 12;
      return `${h} hour ${m} min${a}`;
    }
  }
// get count for the que using q id 
app.get('/api/get-next-person/:qid', (req, res) => {
            try {
                 db.collection('customers').where('businessID', '==', req.params.qid).get().then(querySnapshot => {
                    let docs = querySnapshot.docs;
                    const ids = docs.map(e => parseInt(e.id));
                    const minId = Math.min.apply(Math, ids);
                    const doc = docs.filter(e => (parseInt(e.id) == minId)).shift();
                    if(doc){
                        res.send({number:ids.length,data:doc.data()});
                        /*
                        db.collection('queues').where('businessID', '==', req.params.qid).get().then(querySnapshot2 => {
                            let docs2 = querySnapshot2.docs;
                            const ids2 = docs.map(e => parseInt(e.id));
                            const minId2 = Math.min.apply(Math, ids);
                            const doc2 = docs.filter(e => (parseInt(e.id) == minId)).shift();
                            if(doc2){
                                res.send({customer: doc.data(), queue: doc2.data()});
                            }else{
                                return res.status(500).send("No person next");
                            }
                        });
                        */
                    }else{
                        //
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

// mailer function 
app.post('/api/send-email', (req, res) => {
    var mailOptions = {
        from: 'QME2020QFX@gmail.com',
        to: req.body.emailAddress,
        subject: 'Q-ME',
        html: bodyEm,
        name:req.body.name
   
        
     }
     
     mail.sendMail(mailOptions, function(error, info){
           if (error) {
             console.log(error);
             res.send("It did not work!")
           } else {
             console.log('Email sent: ' + info.response);
             res.send("Email Sent");
           }
     });
});

// end  mailer function 

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


var port = 8080;
app.listen(port, () => {
    console.log('SERVER STARTED on '+port.toString());
});
