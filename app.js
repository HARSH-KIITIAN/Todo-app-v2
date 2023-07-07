//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const _ = require('lodash');
const date = require(__dirname + "/date.js");

const app = express();
dotenv.config();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  const MONGO_URL = process.env.MONGO_URL
  await mongoose.connect(MONGO_URL);
  const itemsSchema = new mongoose.Schema({
    name: String
  });
  const Item = mongoose.model("Item", itemsSchema);
  const item1 = new Item({
    name: 'Do Worship'
  });
  const item2 = new Item({
    name: 'Do Meditation'
  });
  const item3 = new Item({
    name: 'Do Workout'
  });

  const defaultItems = [item1,item2,item3];

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
  });
  const List = mongoose.model("List", listSchema);

  const day = date.getDate();
app.get("/", async function(req, res) {
  const foundItems = await Item.find({});
  if(foundItems.length === 0){
    Item.insertMany(defaultItems);
    res.redirect("/");
  } else{
    res.render("list", {listTitle: day, newListItems: foundItems});
  }
});

app.get("/:customListName",async function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  const foundList = await List.findOne({name: customListName});
  if(!foundList){
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    await list.save();
    res.redirect("/"+customListName);
  } else {
    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
  }
});

app.post("/", async function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list;

  if(listName === day) {
    await Item.create({name: item});
    res.redirect("/");
  } else {
    const newItem = {
      name: item
    };
    const foundList = await List.findOne({name: listName});
    foundList.items.push(newItem);
    await foundList.save();
    res.redirect("/"+listName);
  }
});

app.post("/delete", async function(req,res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === day) {
    await Item.findByIdAndRemove(checkedItem);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}});
    res.redirect("/"+listName);
  }
})

app.listen(3000 || process.env.PORT, function() {
  console.log("Server started on port 3000");
});
}