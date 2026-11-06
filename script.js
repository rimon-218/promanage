// DATA
const demo={
 customers:[
  {id:1,name:"John Smith",email:"john@example.com",phone:"01711111111"},
  {id:2,name:"Sarah Ahmed",email:"sarah@example.com",phone:"01822222222"},
  {id:3,name:"David Lee",email:"david@example.com",phone:"01933333333"}
 ],
 products:[
  {id:1,name:"Premium Headphones",category:"Electronics",price:2500,stock:25,image:""},
  {id:2,name:"Wireless Mouse",category:"Accessories",price:800,stock:5,image:""},
  {id:3,name:"Smart Watch",category:"Electronics",price:4500,stock:12,image:""},
  {id:4,name:"Keyboard",category:"Accessories",price:1200,stock:3,image:""}
 ],
 sales:[
  {id:1,customer:"John Smith",product:"Premium Headphones",quantity:2,amount:5000,date:"2026-11-01"},
  {id:2,customer:"Sarah Ahmed",product:"Wireless Mouse",quantity:1,amount:800,date:"2026-11-02"}
 ]
};

let db=JSON.parse(localStorage.getItem("promanage_data"))||demo;
let currentType="",editId=null;
let pages={customers:1,products:1,sales:1};
const perPage=5;
const money=n=>"৳"+Number(n).toLocaleString("en-US");

function save(){
 localStorage.setItem("promanage_data",JSON.stringify(db));
 render();
}
function escapeHTML(value){
 return String(value??"").replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 }[c]));
}

// NAVIGATION
function showPage(page){
 document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
 document.getElementById(page).classList.add("active");
 document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 document.getElementById("pageTitle").textContent=page.charAt(0).toUpperCase()+page.slice(1);
 document.getElementById("sidebar").classList.remove("open");
 render();
}
document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");

// THEME
function toggleTheme(){
 document.body.classList.toggle("dark");
 localStorage.setItem("promanage_theme",document.body.classList.contains("dark")?"dark":"light");
 document.getElementById("themeBtn").textContent=document.body.classList.contains("dark")?"☀️":"🌙";
}
if(localStorage.getItem("promanage_theme")==="dark")document.body.classList.add("dark");
document.getElementById("themeBtn").onclick=toggleTheme;
document.getElementById("themeBtn").textContent=document.body.classList.contains("dark")?"☀️":"🌙";

// MODAL
function field(label,name,type="text",value="",full=false){
 return `<div class="form-group ${full?"full":""}">
 <label>${label}</label><input name="${name}" type="${type}" value="${escapeHTML(value)}" ${name==="image"?"accept='image/*'":""} ${type==="file"?"": "required"}></div>`;
}
function openModal(type,id=null){
 currentType=type;editId=id;
 let item=id?db[type==="sale"?"sales":type==="customer"?"customers":"products"].find(x=>x.id===id):{};
 const f=document.getElementById("formFields");
 let html="";
 if(type==="customer"){
  html=field("Customer Name","name","text",item?.name)+field("Email","email","email",item?.email)+field("Phone","phone","tel",item?.phone);
 }
 if(type==="product"){
  html=field("Product Name","name","text",item?.name)+field("Category","category","text",item?.category)+field("Price (৳)","price","number",item?.price)+field("Stock Quantity","stock","number",item?.stock)+field("Product Image (Optional)","image","file","",true);
 }
 if(type==="sale"){
  html=`<div class="form-group full"><label>Customer</label><select name="customer" required>${db.customers.map(c=>`<option>${escapeHTML(c.name)}</option>`).join("")}</select></div>
  <div class="form-group full"><label>Product</label><select name="product" required>${db.products.map(p=>`<option>${escapeHTML(p.name)}</option>`).join("")}</select></div>`+field("Quantity","quantity","number","1");
 }
 if(type==="sale"&&(!db.customers.length||!db.products.length)){
  alert("Add at least one customer and product first.");return;
 }
 f.innerHTML=html;
 document.getElementById("modalTitle").textContent=(id?"Edit ":"Add ")+type;
 document.getElementById("modal").classList.add("show");
}
function closeModal(){document.getElementById("modal").classList.remove("show")}
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};

document.getElementById("modalForm").onsubmit=async e=>{
 e.preventDefault();
 const form=e.target;
 const data=Object.fromEntries(new FormData(form).entries());
 if(currentType==="product"&&Number(data.price)<0||currentType==="product"&&Number(data.stock)<0){alert("Price and stock cannot be negative.");return;}
 if(currentType==="sale"&&(!Number.isInteger(Number(data.quantity))||Number(data.quantity)<1)){alert("Enter a valid quantity.");return;}

 let list=db[currentType==="customer"?"customers":currentType==="sale"?"sales":"products"];
 let old=editId?list.find(x=>x.id===editId):null;

 if(currentType==="product"){
  data.price=Number(data.price);data.stock=Number(data.stock);
  data.image=old?.image||"";
  const file=form.elements.image.files[0];
  if(file){
   if(file.size>2*1024*1024){alert("Image must be under 2 MB.");return;}
   data.image=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;reader.readAsDataURL(file);
   });
  }
 }
 if(currentType==="sale"){
  const product=db.products.find(p=>p.name===data.product);
  data.quantity=Number(data.quantity);
  if(product.stock<data.quantity){alert("Not enough stock available.");return;}
  product.stock-=data.quantity;
  data.amount=product.price*data.quantity;
  data.date=new Date().toISOString().slice(0,10);
 }
 if(editId){
  Object.assign(old,data);
 }else{
  list.push({id:Date.now(),...data});
 }
 save();closeModal();form.reset();
};

// PAGINATION
function paginated(type,data,container,draw){
 const pagesCount=Math.max(1,Math.ceil(data.length/perPage));
 pages[type]=Math.min(pages[type],pagesCount);
 const start=(pages[type]-1)*perPage;
 draw(data.slice(start,start+perPage));
 const el=document.getElementById(container);
 el.innerHTML=`<span>Showing ${data.length?start+1:0}-${Math.min(start+perPage,data.length)} of ${data.length}</span>
 <div><button ${pages[type]===1?"disabled":""} onclick="changePage('${type}',-1)">Previous</button>
 <button ${pages[type]===pagesCount?"disabled":""} onclick="changePage('${type}',1)">Next</button></div>`;
}
function changePage(type,dir){pages[type]+=dir;render();}

// TABLES
function renderCustomers(){
 const q=document.getElementById("customerSearch").value.toLowerCase();
 const data=db.customers.filter(c=>(c.name+" "+c.email+" "+c.phone).toLowerCase().includes(q));
 paginated("customers",data,"customerPagination",items=>{
  document.getElementById("customerTable").innerHTML=items.map(c=>`<tr>
  <td>${escapeHTML(c.name)}</td><td>${escapeHTML(c.email)}</td><td>${escapeHTML(c.phone)}</td>
  <td><button class="action" onclick="openModal('customer',${c.id})">Edit</button><button class="action" onclick="removeItem('customers',${c.id})">Delete</button></td></tr>`).join("")||'<tr><td colspan="4" class="empty">No customers found</td></tr>';
 });
}
function renderProducts(){
 const q=document.getElementById("productSearch").value.toLowerCase();
 const filter=document.getElementById("stockFilter").value;
 const data=db.products.filter(p=>{
  const match=(p.name+" "+p.category).toLowerCase().includes(q);
  return match&&(filter==="all"||(filter==="low"?p.stock<=5:p.stock>5));
 });
 paginated("products",data,"productPagination",items=>{
  document.getElementById("productTable").innerHTML=items.map(p=>`<tr>
  <td>${p.image?`<img class="product-img" src="${p.image}" alt="">`:""}${escapeHTML(p.name)}</td>
  <td>${escapeHTML(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td>
  <td><span class="status ${p.stock<=5?"low":""}">${p.stock<=5?"Low Stock":"Available"}</span></td>
  <td><button class="action" onclick="openModal('product',${p.id})">Edit</button><button class="action" onclick="removeItem('products',${p.id})">Delete</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty">No products found</td></tr>';
 });
}
function renderSales(){
 const q=document.getElementById("salesSearch").value.toLowerCase();
 const data=db.sales.filter(s=>(s.customer+" "+s.product).toLowerCase().includes(q));
 paginated("sales",data,"salesPagination",items=>{
  document.getElementById("salesTable").innerHTML=items.map(s=>`<tr>
  <td>${escapeHTML(s.customer)}</td><td>${escapeHTML(s.product)}</td><td>${s.quantity}</td><td>${money(s.amount)}</td><td>${s.date}</td>
  <td><button class="action" onclick="removeItem('sales',${s.id})">Delete</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty">No sales found</td></tr>';
 });
}

// DELETE
function removeItem(type,id){
 if(!confirm("Are you sure you want to delete this item?"))return;
 if(type==="sales"){
  const sale=db.sales.find(s=>s.id===id);
  const product=db.products.find(p=>p.name===sale.product);
  if(product)product.stock+=sale.quantity;
 }
 db[type]=db[type].filter(x=>x.id!==id);
 save();
}

// CSV EXPORT
function exportCSV(type){
 const rows=db[type];
 if(!rows.length){alert("No data to export.");return}
 const keys=Object.keys(rows[0]);
 const csv=[keys.join(","),...rows.map(row=>keys.map(k=>'"'+String(row[k]??"").replace(/"/g,'""')+'"').join(","))].join("\n");
 const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download=type+"-report.csv";a.click();
 URL.revokeObjectURL(url);
}

// DASHBOARD
function renderDashboard(){
 const revenue=db.sales.reduce((sum,s)=>sum+s.amount,0);
 document.getElementById("revenue").textContent=money(revenue);
 document.getElementById("orders").textContent=db.sales.length;
 document.getElementById("customerCount").textContent=db.customers.length;
 document.getElementById("productCount").textContent=db.products.length;
 document.getElementById("reportRevenue").textContent=money(revenue);
 document.getElementById("reportOrders").textContent=db.sales.length;
 document.getElementById("lowStock").textContent=db.products.filter(p=>p.stock<=5).length;
 document.getElementById("inventoryValue").textContent=money(db.products.reduce((s,p)=>s+p.price*p.stock,0));

 document.getElementById("inventoryOverview").innerHTML=db.products.map(p=>`
 <div style="margin:15px 0">
 <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:7px">
 <span>${escapeHTML(p.name)}</span><b>${p.stock} units</b></div>
 <div style="height:8px;background:var(--border);border-radius:10px;overflow:hidden">
 <div style="height:100%;width:${Math.min(p.stock,100)}%;background:${p.stock<=5?"#e9a23b":"#6558e8"};border-radius:10px"></div></div></div>`).join("")||'<p class="empty">No products yet</p>';

 document.getElementById("recentSales").innerHTML=[...db.sales].reverse().slice(0,5).map(s=>`
 <tr><td>${escapeHTML(s.customer)}</td><td>${escapeHTML(s.product)}</td><td>${money(s.amount)}</td><td>${s.date}</td></tr>`).join("")||'<tr><td colspan="4" class="empty">No sales yet</td></tr>';

 // Revenue chart from last 6 months
 const labels=Array.from({length:6},(_,i)=>{
  const d=new Date();d.setMonth(d.getMonth()-5+i);
  return d.toLocaleString("en-US",{month:"short"});
 });
 const values=labels.map((_,i)=>{
  const d=new Date();d.setMonth(d.getMonth()-5+i);
  const key=d.toISOString().slice(0,7);
  return db.sales.filter(s=>s.date.startsWith(key)).reduce((sum,s)=>sum+s.amount,0);
 });
 const max=Math.max(...values,100);
 const pts=values.map((v,i)=>({x:40+i*110,y:180-(v/max)*145}));
 const path=pts.map((p,i)=>(i?"L":"M")+p.x+" "+p.y).join(" ");
 document.getElementById("chartLine").setAttribute("d",path);
 document.getElementById("chartArea").setAttribute("d",path+" L"+pts[5].x+" 180 L"+pts[0].x+" 180 Z");
 document.getElementById("chartLabels").innerHTML=labels.map((l,i)=>`<text x="${40+i*110}" y="205" text-anchor="middle">${l}</text>`).join("");
}

// SEARCH
["customerSearch","productSearch","salesSearch"].forEach(id=>{
 document.getElementById(id).addEventListener("input",()=>{
  pages[id==="customerSearch"?"customers":id==="productSearch"?"products":"sales"]=1;
  render();
 });
});
document.getElementById("stockFilter").onchange=()=>{pages.products=1;render()};

function render(){
 renderDashboard();
 renderCustomers();
 renderProducts();
 renderSales();
}
function resetData(){
 if(confirm("Reset all demo data?")){
  db=JSON.parse(JSON.stringify(demo));save();
 }
}
render();