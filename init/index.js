const mongoose=require("mongoose");
const initData=require("../init/data.js");
const Post=require("../models/post.js");

async function main(){
    await mongoose.connect("mongodb+srv://shettyankith:1su21cs012@cluster0.lqqy6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
}

main().then(()=>{
    console.log("Connection Established");
}).catch(err=>{
    console.log("Some error in database")
});

const initDB=async ()=>{
    await Post.deleteMany({});
    // Post.data=initData.data.map((obj)=>({...obj,owner:"65c78c19e3ce1af8332debcc",}));
    await Post.insertMany(initData.data);//Since initData is a object
    console.log("DB is cleaned and updated")
}

initDB();