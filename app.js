const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname+"/date.js");
const _ = require("lodash")

const app = express();


app.set('view engine' , 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
//mongodb://127.0.0.1:27017/todolistDB  for local database, we had use this uptill now
mongoose.connect("mongodb+srv://prashant:Prashant-123@cluster0.pqbwxoz.mongodb.net/todolistDB")

const itemSchema = ({
  name: String
})

const Item= mongoose.model("Item", itemSchema);

const firstItem = new Item({
  name:"Welcome to your ToDoList!"
})
const secondItem = new Item({
  name: "Hit the + button to add a new item"
})
const thirdItem = new Item({
  name: "<-- Click on this to delete an item"
})

const defaultItems = [firstItem, secondItem, thirdItem]

// Item.insertMany(defaultItems)
// .then({
//   function(err){
//     console.log(err)
//   }
// })

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List= mongoose.model("List",listSchema)

app.get("/", function(req, res){
  let day =date.getDay();
  Item.find({})
  .then(function(foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems)
      .then({
        function(err){
          console.log(err)
        }
      })
      res.redirect("/")
    }
    else{
      res.render("list", {listTitle:"today" , newListItems: foundItems})     // day---> "today"
    }
  })
});

app.post("/", function(req, res){
  const itemName =req.body.newItem;
  const listName= req.body.list;   

  const item = new Item({
    name: itemName
  })
  let day =date.getDay();
  if (listName==="today"){              //changes
    item.save();
    res.redirect("/")
  }
  else{
    async function addToCurrentList(){
      const foundList=await List.findOne({name:listName})
      await foundList.items.push(item);
      await foundList.save();
      res.redirect("/"+listName)
    }
    addToCurrentList()
    
  }
  
})

app.post("/delete", function(req, res){
  const checkedItemId= req.body.checkbox;
  const listName= req.body.listName

  if(listName==="today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(function(err){
    console.log(err)
    })
    res.redirect("/")
  }
  else{
    async function findandDeleteOther(){
      const foundList= await List.findOne({name:listName})
      foundList.items.pull({ _id: checkedItemId });         //alternative method, not from video
      await foundList.save();
      res.redirect("/"+listName)
      //setTimeout(() => { res.redirect('/' + listName);}, 2000);
    }
    findandDeleteOther();
}})

app.get("/:customListName", function(req, res){
  const customListName= _.capitalize(req.params.customListName)
  
  
  async function findExistingList(){
    try{
      const foundList= await List.findOne({name: customListName})
      if(!foundList){
        //create a new list
        const list = new List({
        name: customListName,
        items: defaultItems
      })
      await list.save()
      res.redirect("/"+customListName)
      //setTimeout(() => { res.redirect('/' + customListName);}, 2000);
      }
      else{
        //render existing list
        res.render("list",{listTitle:foundList.name, newListItems:foundList.items})
      }
    }catch(err){
      console.log(err)
    }
  }
  findExistingList()
})

app.get("/about", function(req,res){
  res.render("about");
})

app.listen(3000, function(){
  console.log("Server is started on port 3000...");
});