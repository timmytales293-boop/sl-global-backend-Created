const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CRYPTO_TOKEN = process.env.CRYPTO_TOKEN;

let db = { users: [], withdraws: [] };

app.get('/', (req,res)=>res.send("SL Global Backend Running ✅"));

app.post('/api/user', (req,res)=>{
  const {id, username} = req.body;
  let u = db.users.find(x=>x.id==id);
  if(!u){ u={id, username, balance:0}; db.users.push(u); }
  res.json(u);
});

app.post('/api/withdraw-auto', async (req,res)=>{
  const {id, cryptoUserId, amount} = req.body;
  if(amount < 1) return res.json({error:"Minimum $1"});
  // CryptoBot দিয়ে USDT পাঠানো
  let pay = await fetch('https://pay.crypt.bot/api/transfer', {
    method:'POST',
    headers:{ 'Crypto-Pay-API-Token': CRYPTO_TOKEN, 'Content-Type':'application/json' },
    body: JSON.stringify({ user_id: Number(cryptoUserId), asset:"USDT", amount:String(amount), spend_id:"SL"+Date.now()+id })
  }).then(r=>r.json());
  if(pay.ok){
    db.withdraws.push({userId:id, amount, status:"PAID", date:new Date().toISOString()});
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:id, text:`✅ $${amount} USDT Paid! - SL Global`})});
    res.json({ok:true});
  } else res.json({error:"CryptoBot Balance Check Koro"});
});

app.get('/api/admin/withdraws', (req,res)=>res.json(db.withdraws));

app.listen(process.env.PORT || 3000, ()=>console.log("Running"));
