(() => {
"use strict";

/* SWEET's KITCHEN & COLLECTIONS — ADMIN DASHBOARD
   Requires Supabase JS v2 loaded before this file. */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_QN5w738LnyUrYy2X93M1OQ_md6F2xTN";

if (!window.supabase?.createClient) {
    console.error("Supabase JS v2 is missing. Load its CDN before admin.js.");
    alert("Admin dashboard could not start. Refresh the page.");
    return;
}

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY
);

const $ = id => document.getElementById(id);

const money = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2
});

let currentAdmin = null;
let products = [];
let orders = [];
let flashSales = [];
let editingProductId = null;
let dashboardLoading = false;
let storeSettingsLoaded = false;

let storeSettings = {
    id: true,
    is_open: true,
    closed_message: "Our store is temporarily closed. Please check back soon."
};

/* DOM ELEMENTS */

const el = {
    loginPanel: $("loginPanel"),
    dashboard: $("dashboard"),
    loginForm: $("adminLoginForm"),
    email: $("adminEmail"),
    password: $("adminPassword"),
    loginButton: $("loginButton"),
    loginMessage: $("loginMessage"),
    adminName: $("adminName"),
    adminEmail: $("adminEmailDisplay"),
    logout: $("logoutButton"),
    pageTitle: $("pageTitle"),
    refreshDashboard: $("refreshDashboardButton"),
    globalMessage: $("globalMessage"),
    menu: $("mobileMenuButton"),
    sidebar: $("sidebar"),
    overlay: $("sidebarOverlay"),
    today: $("todayDate"),
    totalSales: $("totalSales"),
    totalOrders: $("totalOrders"),
    pending: $("pendingOrders"),
    totalProducts: $("totalProducts"),
    pendingBadge: $("navPendingCount"),
    recentBody: $("recentOrdersBody"),

    ordersBody: $("ordersTableBody"),
    ordersMessage: $("ordersMessage"),
    searchOrders: $("searchOrders"),
    orderFilter: $("orderStatusFilter"),
    refreshOrders: $("refreshOrdersButton"),

    productsBody: $("productsTableBody"),
    productsMessage: $("productsMessage"),
    searchProducts: $("searchProducts"),
    categoryFilter: $("productCategoryFilter"),
    addProduct: $("addProductButton"),

    productModal: $("productModal"),
    productForm: $("productForm"),
    productModalTitle: $("productModalTitle"),
    productId: $("productId"),
    productName: $("productName"),
    productDescription: $("productDescription"),
    productCategory: $("productCategory"),
    productPrice: $("productPrice"),
    productStock: $("productStock"),
    productImage: $("productImage"),
    productImageFile: $("productImageFile"),
    productPreview: $("productImagePreview"),
    productActive: $("productActive"),
    productMessage: $("productFormMessage"),
    saveProduct: $("saveProductButton"),

    addSale: $("addFlashSaleButton"),
    saleModal: $("flashSaleModal"),
    saleForm: $("flashSaleForm"),
    saleProduct: $("saleProduct"),
    saleDiscount: $("saleDiscount"),
    saleStart: $("saleStart"),
    saleEnd: $("saleEnd"),
    saveSale: $("saveFlashSaleButton"),
    salesMessage: $("salesMessage"),
    salesBody: $("flashSalesTableBody"),

    storeStatus: $("storeStatusText"),
    storeDescription: $("storeStatusDescription"),
    closedMessage: $("storeClosedMessage"),
    saveStoreMessage: $("saveStoreMessageButton"),
    toggleStore: $("toggleStoreButton"),
    storeMessage: $("storeControlMessage")
};

/* GENERAL HELPERS */

function formatMoney(value) {
    return money.format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GH", {
        timeZone: "Africa/Accra",
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function todayInGhana() {
    return new Intl.DateTimeFormat("en-GH", {
        timeZone: "Africa/Accra",
        dateStyle: "full"
    }).format(new Date());
}

function showMessage(element, message, type = "info") {
    if (!element) return;

    element.textContent = String(message ?? "");
    element.className = "message show " + type;
}

function hideMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "message";
}

function globalMessage(message) {
    showMessage(el.globalMessage, message, "info");
}

function clearGlobalMessage() {
    hideMessage(el.globalMessage);
}

function tableMessage(element, message) {
    if (!element) return;

    element.textContent = message;
    element.classList.add("show");
}

function clearTableMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.classList.remove("show");
}

function loading(button, isLoading, label = "Please wait...") {
    if (!button) return;

    if (isLoading) {
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }

        button.textContent = label;
        button.disabled = true;
    } else {
        button.textContent =
            button.dataset.originalText || button.textContent;

        delete button.dataset.originalText;
        button.disabled = false;
    }
}

function cell(value, className = "") {
    const td = document.createElement("td");

    td.textContent = value ?? "";

    if (className) td.className = className;

    return td;
}

function badge(status) {
    const span = document.createElement("span");
    const safeStatus = String(status || "unknown").toLowerCase();

    span.className = "status-badge " + safeStatus;
    span.textContent = safeStatus.replaceAll("_", " ");

    return span;
}

function emptyRow(body, message, columns) {
    if (!body) return;

    body.replaceChildren();

    const tr = document.createElement("tr");
    const td = document.createElement("td");

    td.colSpan = columns;
    td.className = "empty-cell";
    td.textContent = message;

    tr.appendChild(td);
    body.appendChild(tr);
}

function actionButton(label, action, id, extra = "secondary-button") {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.className = "small-button " + extra;
    button.dataset.action = action;
    button.dataset.id = String(id);

    return button;
}

function handleError(error) {
    console.error(error);
    globalMessage(error?.message || "Something went wrong.");
}

/* MODAL FUNCTIONS */

function openModal(modal) {
    if (!modal) return;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    if (!modal) return;

    modal.hidden = true;

    if (!document.querySelector(".modal-backdrop:not([hidden])")) {
        document.body.style.overflow = "";
    }
}

document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal($(button.dataset.closeModal));
    });
});

document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal-backdrop").forEach(closeModal);
    }
});

/* LOGIN AND ADMIN VERIFICATION */

function showLogin() {
    if (el.dashboard) el.dashboard.hidden = true;
    if (el.loginPanel) el.loginPanel.hidden = false;

    currentAdmin = null;
}

function showDashboard(user) {
    currentAdmin = user;

    if (el.loginPanel) el.loginPanel.hidden = true;
    if (el.dashboard) el.dashboard.hidden = false;

    if (el.adminName) {
        el.adminName.textContent =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Administrator";
    }

    if (el.adminEmail) {
        el.adminEmail.textContent = user.email || "";
    }

    const avatar = document.querySelector(".admin-avatar");

    if (avatar) {
        avatar.textContent =
            (el.adminName?.textContent || "A")
                .trim()
                .charAt(0)
                .toUpperCase() || "A";
    }

    if (el.today) {
        el.today.textContent = todayInGhana();
    }

    navigate("overview");
    loadDashboard();
}

async function verifyAdmin(user) {
    if (!user?.id) {
        throw new Error("Your account could not be verified.");
    }

    const { data, error } = await supabase
        .from("store_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        throw new Error(
            "Could not verify administrator access: " + error.message
        );
    }

    if (!data) {
        throw new Error(
            "This account is not registered as a store administrator."
        );
    }
}

if (el.loginForm) {
    el.loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        hideMessage(el.loginMessage);

        if (!el.email || !el.password) {
            showMessage(
                el.loginMessage,
                "Login form fields are missing.",
                "error"
            );
            return;
        }

        loading(el.loginButton, true, "Signing in...");

        try {
            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email: el.email.value.trim(),
                    password: el.password.value
                });

            if (error) throw error;

            await verifyAdmin(data.user);

            showMessage(
                el.loginMessage,
                "Login successful.",
                "success"
            );

            showDashboard(data.user);

        } catch (error) {
            await supabase.auth.signOut();

            showMessage(
                el.loginMessage,
                error.message || "Login failed.",
                "error"
            );

        } finally {
            loading(el.loginButton, false);
        }
    });
}

async function restoreSession() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session?.user) {
            showLogin();
            return;
        }

        await verifyAdmin(data.session.user);
        showDashboard(data.session.user);

    } catch (error) {
        console.error("Session restoration:", error);

        await supabase.auth.signOut();
        showLogin();
    }
}

if (el.logout) {
    el.logout.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to sign out?")) return;

        const { error } = await supabase.auth.signOut();

        if (error) {
            globalMessage(error.message);
            return;
        }

        closeSidebar();
        showLogin();

        if (el.password) el.password.value = "";
    });
}

/* NAVIGATION */

const titles = {
    overview: "Dashboard Overview",
    orders: "Order Management",
    products: "Product Management",
    "flash-sales": "Flash Sales",
    customers: "Customer Management",
    "store-control": "Store Control"
};

function navigate(name) {
    const target = $("section-" + name);

    if (!target) return;

    document.querySelectorAll(".dashboard-section").forEach(section => {
        section.classList.remove("active-section");
    });

    target.classList.add("active-section");

    document.querySelectorAll("[data-section]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === name
        );
    });

    if (el.pageTitle) {
        el.pageTitle.textContent = titles[name] || "Dashboard";
    }

    closeSidebar();

    if (name === "store-control") loadStoreSettings();
    if (name === "orders") loadOrders().catch(handleError);
    if (name === "products") loadProducts().catch(handleError);
    if (name === "flash-sales") loadFlashSales().catch(handleError);
}

document.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", () => {
        navigate(button.dataset.section);
    });
});

function openSidebar() {
    el.sidebar?.classList.add("open");
    el.overlay?.classList.add("show");
}

function closeSidebar() {
    el.sidebar?.classList.remove("open");
    el.overlay?.classList.remove("show");
}

if (el.menu) {
    el.menu.addEventListener("click", () => {
        if (el.sidebar?.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
}

if (el.overlay) {
    el.overlay.addEventListener("click", closeSidebar);
}

 /* DASHBOARD */
async function loadDashboard(){
 if(dashboardLoading)return;
 dashboardLoading=true;
 clearGlobalMessage();

 try{
  await Promise.all([
   loadProducts(),
   loadOrders(),
   loadFlashSales(),
   loadStoreSettings()
  ]);
  updateStats();
 }catch(error){
  handleError(error);
 }finally{
  dashboardLoading=false;
 }
}

function updateStats(){
 const paid=orders.filter(o=>
  String(o.payment_status||"").toLowerCase()==="paid"
 );

 const sales=paid.reduce(
  (sum,o)=>sum+(Number(o.total_amount)||0),0
 );

 const pending=orders.filter(o=>
  String(o.order_status||"").toLowerCase()==="pending"
 ).length;

 if(el.totalSales)el.totalSales.textContent=formatMoney(sales);
 if(el.totalOrders)el.totalOrders.textContent=String(orders.length);
 if(el.pending)el.pending.textContent=String(pending);

 if(el.totalProducts){
  el.totalProducts.textContent=String(
   products.filter(p=>p.is_active===true).length
  );
 }

 if(el.pendingBadge)el.pendingBadge.textContent=String(pending);

 renderRecentOrders();
}


/* ==========================================
   PRODUCTS MANAGEMENT
========================================== */

async function loadProducts(){
 clearTableMessage(el.productsMessage);

 const {data,error}=await supabase
  .from("store_products")
  .select("id,name,description,price,category,image_url,stock,is_active,created_at")
  .order("created_at",{ascending:false});

 if(error)throw error;

 products=data||[];

 renderProducts();
 updateCategoryFilter();
 updateSaleProductOptions();
}

function renderProducts(){
 if(!el.productsBody)return;

 const q=(el.searchProducts?.value||"").trim().toLowerCase();
 const cat=el.categoryFilter?.value||"";

 const list=products.filter(p=>
  String(p.name||"").toLowerCase().includes(q)&&
  (!cat||p.category===cat)
 );

 el.productsBody.replaceChildren();

 if(!list.length){
  emptyRow(el.productsBody,"No products found.",6);
  return;
 }

 list.forEach(p=>{
  const tr=document.createElement("tr");

  const td=document.createElement("td");
  const wrap=document.createElement("div");
  wrap.className="table-product";

  const img=document.createElement("img");
  img.src=p.image_url||"";
  img.alt=p.name||"Product";
  img.onerror=()=>img.style.display="none";

  const info=document.createElement("div");
  const name=document.createElement("strong");
  const desc=document.createElement("small");

  name.textContent=p.name||"Unnamed product";
  desc.textContent=p.description||"No description";

  info.append(name,desc);
  wrap.append(img,info);
  td.appendChild(wrap);
  tr.appendChild(td);

  tr.append(
   cell(p.category||"—"),
   cell(formatMoney(p.price)),
   cell(String(p.stock??0))
  );

  const visibility=document.createElement("td");
  visibility.appendChild(badge(p.is_active?"active":"inactive"));
  tr.appendChild(visibility);

  const actions=document.createElement("td");
  const group=document.createElement("div");
  group.className="button-group";

  group.append(
   actionButton("Edit","edit-product",p.id),
   actionButton(
    p.is_active?"Hide":"Show",
    "toggle-product",
    p.id
   ),
   actionButton(
    "Delete",
    "delete-product",
    p.id,
    "danger-button"
   )
  );

  actions.appendChild(group);
  tr.appendChild(actions);

  el.productsBody.appendChild(tr);
 });
}

function updateCategoryFilter(){
 if(!el.categoryFilter)return;

 const selected=el.categoryFilter.value;

 const cats=[
  ...new Set(products.map(p=>p.category).filter(Boolean))
 ].sort();

 el.categoryFilter.replaceChildren();

 const all=document.createElement("option");
 all.value="";
 all.textContent="All categories";
 el.categoryFilter.appendChild(all);

 cats.forEach(c=>{
  const o=document.createElement("option");
  o.value=c;
  o.textContent=c;
  el.categoryFilter.appendChild(o);
 });

 if(cats.includes(selected)){
  el.categoryFilter.value=selected;
 }
}

if(el.searchProducts){
 el.searchProducts.addEventListener("input",renderProducts);
}

if(el.categoryFilter){
 el.categoryFilter.addEventListener("change",renderProducts);
}


/* PRODUCT IMAGE PREVIEW */

if(el.productImageFile){
 el.productImageFile.addEventListener("change",()=>{
  const file=el.productImageFile.files?.[0];

  if(!file){
   if(el.productPreview){
    el.productPreview.removeAttribute("src");
    el.productPreview.hidden=true;
   }
   return;
  }

  if(!file.type.startsWith("image/")||file.size>5*1024*1024){
   showMessage(
    el.productMessage,
    !file.type.startsWith("image/")
     ?"Choose a valid image file."
     :"Image size must not exceed 5 MB.",
    "error"
   );

   el.productImageFile.value="";
   return;
  }

  if(el.productPreview?.dataset.previewUrl){
   URL.revokeObjectURL(el.productPreview.dataset.previewUrl);
  }

  const url=URL.createObjectURL(file);

  if(el.productPreview){
   el.productPreview.dataset.previewUrl=url;
   el.productPreview.src=url;
   el.productPreview.hidden=false;
  }

  hideMessage(el.productMessage);
 });
}


/* ADD NEW PRODUCT */

function newProduct(){
 if(!el.productForm)return;

 editingProductId=null;
 el.productForm.reset();

 if(el.productPreview){
  if(el.productPreview.dataset.previewUrl){
   URL.revokeObjectURL(el.productPreview.dataset.previewUrl);
  }

  el.productPreview.removeAttribute("src");
  el.productPreview.hidden=true;
 }

 if(el.productId)el.productId.value="";
 if(el.productStock)el.productStock.value="0";
 if(el.productActive)el.productActive.checked=true;

 if(el.productModalTitle){
  el.productModalTitle.textContent="Add New Product";
 }

 if(el.saveProduct){
  el.saveProduct.textContent="Save Product";
 }

 hideMessage(el.productMessage);
 openModal(el.productModal);
}


/* EDIT PRODUCT */

function editProduct(id){
 const p=products.find(x=>String(x.id)===String(id));

 if(!p||!el.productForm)return;

 editingProductId=p.id;

 if(el.productId)el.productId.value=p.id;
 if(el.productName)el.productName.value=p.name||"";

 if(el.productDescription){
  el.productDescription.value=p.description||"";
 }

 if(el.productCategory){
  el.productCategory.value=p.category||"";
 }

 if(el.productPrice)el.productPrice.value=p.price??0;
 if(el.productStock)el.productStock.value=p.stock??0;

 if(el.productImage){
  el.productImage.value=p.image_url||"";
 }

 if(el.productImageFile){
  el.productImageFile.value="";
 }

 if(el.productPreview){
  if(el.productPreview.dataset.previewUrl){
   URL.revokeObjectURL(el.productPreview.dataset.previewUrl);
  }

  el.productPreview.dataset.previewUrl="";
  el.productPreview.hidden=!p.image_url;

  if(p.image_url){
   el.productPreview.src=p.image_url;
  }
 }

 if(el.productActive){
  el.productActive.checked=p.is_active===true;
 }

 if(el.productModalTitle){
  el.productModalTitle.textContent="Edit Product";
 }

 if(el.saveProduct){
  el.saveProduct.textContent="Update Product";
 }

 hideMessage(el.productMessage);
 openModal(el.productModal);
}


/* UPLOAD PRODUCT IMAGE */

async function uploadImage(file){
 if(![
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
 ].includes(file.type)){
  throw new Error("Use a JPG, PNG, WEBP or GIF image.");
 }

 if(file.size>5*1024*1024){
  throw new Error("Image size must not exceed 5 MB.");
 }

 const ext=(file.name.split(".").pop()||"jpg").toLowerCase();

 const path=(
  crypto.randomUUID
   ?crypto.randomUUID()
   :Date.now()+"-"+Math.random().toString(16).slice(2)
 )+"."+ext;

 const {error}=await supabase.storage
  .from("product-images")
  .upload(path,file,{
   cacheControl:"3600",
   upsert:false,
   contentType:file.type
  });

 if(error)throw error;

 const {data}=supabase.storage
  .from("product-images")
  .getPublicUrl(path);

 if(!data?.publicUrl){
  throw new Error("Could not generate the uploaded image URL.");
 }

 return data.publicUrl;
}


/* SAVE PRODUCT */

if(el.addProduct){
 el.addProduct.addEventListener("click",newProduct);
}

if(el.productForm){
 el.productForm.addEventListener("submit",async e=>{
  e.preventDefault();

  hideMessage(el.productMessage);

  const name=el.productName?.value.trim()||"";
  const description=el.productDescription?.value.trim()||"";
  const category=el.productCategory?.value.trim()||"";

  const price=Number(el.productPrice?.value);
  const stock=Number(el.productStock?.value);

  let imageUrl=el.productImage?.value.trim()||"";

  if(!name||!category){
   showMessage(
    el.productMessage,
    "Product name and category are required.",
    "error"
   );
   return;
  }

  if(!Number.isFinite(price)||price<0){
   showMessage(
    el.productMessage,
    "Enter a valid product price.",
    "error"
   );
   return;
  }

  if(!Number.isInteger(stock)||stock<0){
   showMessage(
    el.productMessage,
    "Stock must be a whole number of zero or more.",
    "error"
   );
   return;
  }

  const file=el.productImageFile?.files?.[0];

  loading(
   el.saveProduct,
   true,
   file?"Uploading image...":"Saving..."
  );

  try{
   if(file){
    imageUrl=await uploadImage(file);
   }

   const payload={
    name,
    description,
    category,
    price,
    stock,
    image_url:imageUrl||null,
    is_active:el.productActive
     ?el.productActive.checked
     :true
   };

   const result=editingProductId
    ?await supabase
      .from("store_products")
      .update(payload)
      .eq("id",editingProductId)
      .select()
      .single()
    :await supabase
      .from("store_products")
      .insert(payload)
      .select()
      .single();

   if(result.error)throw result.error;

   const edited=Boolean(editingProductId);

   editingProductId=null;

   closeModal(el.productModal);

   await loadProducts();
   updateStats();

   globalMessage(
    edited
     ?"Product updated successfully."
     :"Product added successfully."
   );

  }catch(error){
   console.error(error);

   showMessage(
    el.productMessage,
    error.message||"Unable to save product.",
    "error"
   );

  }finally{
   loading(el.saveProduct,false);
  }
 });
}


/* PRODUCT ACTIONS */

if(el.productsBody){
 el.productsBody.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-action]");

  if(!b)return;

  const id=b.dataset.id;

  try{
   if(b.dataset.action==="edit-product"){
    editProduct(id);
   }

   if(b.dataset.action==="toggle-product"){
    const p=products.find(x=>String(x.id)===String(id));

    if(!p)return;

    const {error}=await supabase
     .from("store_products")
     .update({is_active:!p.is_active})
     .eq("id",id);

    if(error)throw error;

    await loadProducts();
    updateStats();

    globalMessage(
     p.is_active
      ?"Product hidden from the store."
      :"Product is now visible."
    );
   }

   if(b.dataset.action==="delete-product"){
    const p=products.find(x=>String(x.id)===String(id));

    if(!p||!confirm('Delete "'+p.name+'" permanently?')){
     return;
    }

    const {error}=await supabase
     .from("store_products")
     .delete()
     .eq("id",id);

    if(error)throw error;

    await loadProducts();
    await loadFlashSales();
    updateStats();

    globalMessage("Product deleted successfully.");
   }

  }catch(error){
   handleError(error);
  }
 });
}


/* ==========================================
   ORDERS MANAGEMENT
========================================== */

async function loadOrders(){
 clearTableMessage(el.ordersMessage);

 const {data,error}=await supabase
  .from("orders")
  .select("id,order_reference,user_id,total_amount,payment_status,order_status,customer_name,customer_email,customer_phone,delivery_address,items,created_at")
  .order("created_at",{ascending:false});

 if(error)throw error;

 orders=data||[];

 const ids=[
  ...new Set(
   orders.flatMap(o=>
    Array.isArray(o.items)
     ?o.items.map(i=>i.productId||i.product_id).filter(Boolean)
     :[]
   )
  )
 ];

 const images=new Map();

 if(ids.length){
  const r=await supabase
   .from("store_products")
   .select("id,image_url")
   .in("id",ids);

  if(r.error)throw r.error;

  (r.data||[]).forEach(p=>{
   images.set(String(p.id),p.image_url||"");
  });
 }

 orders=orders.map(o=>({
  ...o,
  items:Array.isArray(o.items)
   ?o.items.map(i=>({
     ...i,
     image_url:
      images.get(String(i.productId||i.product_id))||
      i.image_url||
      ""
    }))
   :[]
 }));

 renderOrders();
 updateStats();
}


function renderOrders(){
 if(!el.ordersBody)return;

 const q=(el.searchOrders?.value||"").trim().toLowerCase();
 const status=el.orderFilter?.value||"";

 const list=orders.filter(o=>{
  const text=[
   o.order_reference,
   o.id,
   o.customer_name,
   o.customer_email,
   o.customer_phone
  ].join(" ").toLowerCase();

  return text.includes(q)&&(!status||o.order_status===status);
 });

 el.ordersBody.replaceChildren();

 if(!list.length){
  emptyRow(el.ordersBody,"No orders found.",6);
  return;
 }

 list.forEach(o=>{
  const tr=document.createElement("tr");

  tr.append(
   cell(o.order_reference||o.id),
   cell(formatDate(o.created_at)),
   cell(formatMoney(o.total_amount))
  );

  const pay=document.createElement("td");
  pay.appendChild(badge(o.payment_status));
  tr.appendChild(pay);

  const statusCell=document.createElement("td");
  const select=document.createElement("select");

  select.className="filter-select";
  select.dataset.action="update-order-status";
  select.dataset.id=String(o.id);

  [
   "pending",
   "preparing",
   "ready",
   "delivered",
   "cancelled"
  ].forEach(s=>{
   const op=document.createElement("option");

   op.value=s;
   op.textContent=s[0].toUpperCase()+s.slice(1);
   op.selected=s===o.order_status;

   select.appendChild(op);
  });

  statusCell.appendChild(select);
  tr.appendChild(statusCell);

  const actions=document.createElement("td");

  actions.appendChild(
   actionButton("View Products","view-order",o.id)
  );

  tr.appendChild(actions);

  el.ordersBody.appendChild(tr);


  /* ORDER DETAILS ROW */

  const detailRow=document.createElement("tr");

  detailRow.className="order-details-row";
  detailRow.hidden=true;
  detailRow.dataset.orderDetails=String(o.id);

  const detailCell=document.createElement("td");
  detailCell.colSpan=6;

  const wrap=document.createElement("div");
  wrap.className="order-details-container";

  const heading=document.createElement("h3");
  heading.textContent="Customer Information";

  const customer=document.createElement("div");
  customer.className="order-customer-info";

  [
   ["Name",o.customer_name],
   ["Email",o.customer_email],
   ["Phone",o.customer_phone],
   ["Delivery Address",o.delivery_address],
   ["Payment Status",o.payment_status],
   ["Order Status",o.order_status],
   ["Order Date",formatDate(o.created_at)]
  ].forEach(([k,v])=>{
   const p=document.createElement("p");
   const strong=document.createElement("strong");

   strong.textContent=k+": ";

   p.append(
    strong,
    document.createTextNode(String(v||"Not provided"))
   );

   customer.appendChild(p);
  });

  const productsHeading=document.createElement("h3");
  productsHeading.textContent="Products Purchased";

  const listBox=document.createElement("div");
  listBox.className="order-products-list";

  if(!o.items.length){
   const p=document.createElement("p");
   p.textContent="No product details found for this order.";
   listBox.appendChild(p);
  }

  o.items.forEach(i=>{
   const card=document.createElement("div");
   card.className="order-product-item";

   const img=document.createElement("img");
   img.className="order-item-image";
   img.src=i.image_url||"";
   img.alt=i.name||"Purchased product";
   img.loading="lazy";
   img.onerror=()=>img.style.display="none";

   const info=document.createElement("div");
   info.className="order-product-info";

   const n=document.createElement("h4");
   n.textContent=i.name||"Unnamed product";

   const q=document.createElement("p");
   q.textContent="Quantity: "+(Number(i.quantity)||0);

   const unit=document.createElement("p");
   unit.textContent="Unit Price: "+
    formatMoney(i.unitPrice??i.unit_price);

   const total=document.createElement("strong");
   total.textContent="Total: "+
    formatMoney(i.lineTotal??i.line_total);

   info.append(n,q,unit,total);
   card.append(img,info);
   listBox.appendChild(card);
  });

  const total=document.createElement("p");
  total.className="order-details-total";

  const strong=document.createElement("strong");
  strong.textContent="Order Total: "+formatMoney(o.total_amount);

  total.appendChild(strong);

  wrap.append(
   heading,
   customer,
   productsHeading,
   listBox,
   total
  );

  detailCell.appendChild(wrap);
  detailRow.appendChild(detailCell);

  el.ordersBody.appendChild(detailRow);
 });
}


function renderRecentOrders(){
 if(!el.recentBody)return;

 el.recentBody.replaceChildren();

 const recent=orders.slice(0,5);

 if(!recent.length){
  emptyRow(
   el.recentBody,
   "No orders have been received yet.",
   4
  );
  return;
 }

 recent.forEach(o=>{
  const tr=document.createElement("tr");

  tr.append(
   cell(o.order_reference||o.id),
   cell(formatDate(o.created_at)),
   cell(formatMoney(o.total_amount))
  );

  const td=document.createElement("td");
  td.appendChild(badge(o.order_status));

  tr.appendChild(td);
  el.recentBody.appendChild(tr);
 });
}


if(el.searchOrders){
 el.searchOrders.addEventListener("input",renderOrders);
}

if(el.orderFilter){
 el.orderFilter.addEventListener("change",renderOrders);
}


/* ORDER ACTIONS */

if(el.ordersBody){

 el.ordersBody.addEventListener("click",e=>{
  const b=e.target.closest('button[data-action="view-order"]');

  if(!b)return;

  const row=[
   ...el.ordersBody.querySelectorAll("[data-order-details]")
  ].find(r=>r.dataset.orderDetails===b.dataset.id);

  if(!row)return;

  row.hidden=!row.hidden;

  b.textContent=row.hidden
   ?"View Products"
   :"Hide Products";
 });


 el.ordersBody.addEventListener("change",async e=>{
  const s=e.target.closest(
   'select[data-action="update-order-status"]'
  );

  if(!s)return;

  const id=s.dataset.id;
  const status=s.value;

  if(!confirm('Change this order status to "'+status+'"?')){
   renderOrders();
   return;
  }

  s.disabled=true;

  try{
   const {error}=await supabase
    .from("orders")
    .update({order_status:status})
    .eq("id",id);

   if(error)throw error;

   const o=orders.find(x=>String(x.id)===String(id));

   if(o)o.order_status=status;

   renderOrders();
   updateStats();

   globalMessage("Order status updated successfully.");

  }catch(error){
   handleError(error);
   renderOrders();
  }
 });
}


/* ==========================================
   FLASH SALES MANAGEMENT
========================================== */

function updateSaleProductOptions(){
 if(!el.saleProduct)return;

 const selected=el.saleProduct.value;

 el.saleProduct.replaceChildren();

 const placeholder=document.createElement("option");

 placeholder.value="";
 placeholder.textContent="Select a product";

 el.saleProduct.appendChild(placeholder);

 products.forEach(p=>{
  const op=document.createElement("option");

  op.value=p.id;
  op.textContent=p.name+" — "+formatMoney(p.price);

  el.saleProduct.appendChild(op);
 });

 if(products.some(p=>String(p.id)===String(selected))){
  el.saleProduct.value=selected;
 }
}


async function loadFlashSales(){
 clearTableMessage(el.salesMessage);

 const {data,error}=await supabase
  .from("store_flash_sales")
  .select("id,product_id,discount_percentage,starts_at,ends_at,is_active,created_at,product:store_products(name)")
  .order("created_at",{ascending:false});

 if(error)throw error;

 flashSales=data||[];

 renderFlashSales();
 updateSaleProductOptions();
}


function saleStatus(s){
 if(!s.is_active)return "inactive";

 const now=Date.now();
 const start=new Date(s.starts_at).getTime();
 const end=new Date(s.ends_at).getTime();

 if(!Number.isFinite(start)||!Number.isFinite(end)){
  return "invalid";
 }

 if(now<start)return "upcoming";
 if(now>=end)return "expired";

 return "active";
}


function renderFlashSales(){
 if(!el.salesBody)return;

 el.salesBody.replaceChildren();

 if(!flashSales.length){
  emptyRow(
   el.salesBody,
   "No flash sales have been created.",
   6
  );
  return;
 }

 flashSales.forEach(s=>{
  const tr=document.createElement("tr");

  tr.append(
   cell(s.product?.name||"Product unavailable"),
   cell((Number(s.discount_percentage)||0)+"%"),
   cell(formatDate(s.starts_at)),
   cell(formatDate(s.ends_at))
  );

  const status=document.createElement("td");
  status.appendChild(badge(saleStatus(s)));

  tr.appendChild(status);

  const actions=document.createElement("td");
  const group=document.createElement("div");

  group.className="button-group";

  group.append(
   actionButton(
    s.is_active?"Deactivate":"Activate",
    "toggle-sale",
    s.id
   ),
   actionButton(
    "Delete",
    "delete-sale",
    s.id,
    "danger-button"
   )
  );

  actions.appendChild(group);
  tr.appendChild(actions);

  el.salesBody.appendChild(tr);
 });
}


/* ADD FLASH SALE */

if(el.addSale){
 el.addSale.addEventListener("click",()=>{
  el.saleForm?.reset();

  hideMessage($("saleFormMessage"));

  updateSaleProductOptions();

  if(!products.length){
   showMessage(
    $("saleFormMessage"),
    "Add a product before creating a flash sale.",
    "error"
   );
  }

  openModal(el.saleModal);
 });
}


/* SAVE FLASH SALE */

if(el.saleForm){
 el.saleForm.addEventListener("submit",async e=>{
  e.preventDefault();

  const msg=$("saleFormMessage");

  hideMessage(msg);

  const productId=el.saleProduct?.value||"";
  const discount=Number(el.saleDiscount?.value);

  const start=el.saleStart?.value
   ?new Date(el.saleStart.value)
   :new Date(NaN);

  const end=el.saleEnd?.value
   ?new Date(el.saleEnd.value)
   :new Date(NaN);

  if(!productId){
   showMessage(msg,"Please select a product.","error");
   return;
  }

  if(!Number.isFinite(discount)||discount<=0||discount>=100){
   showMessage(
    msg,
    "Discount must be between 1 and 99 percent.",
    "error"
   );
   return;
  }

  if(
   Number.isNaN(start.getTime())||
   Number.isNaN(end.getTime())||
   end<=start
  ){
   showMessage(
    msg,
    "The end date must be later than the start date.",
    "error"
   );
   return;
  }

  loading(el.saveSale,true,"Creating...");

  try{
   const {error}=await supabase
    .from("store_flash_sales")
    .insert({
     product_id:productId,
     discount_percentage:discount,
     starts_at:start.toISOString(),
     ends_at:end.toISOString(),
     is_active:true
    });

   if(error)throw error;

   closeModal(el.saleModal);

   await loadFlashSales();

   globalMessage("Flash sale created successfully.");

  }catch(error){
   showMessage(
    msg,
    error.message||"Unable to create flash sale.",
    "error"
   );

  }finally{
   loading(el.saveSale,false);
  }
 });
}


/* FLASH SALE ACTIONS */

if(el.salesBody){
 el.salesBody.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-action]");

  if(!b)return;

  try{
   if(b.dataset.action==="toggle-sale"){
    const s=flashSales.find(
     x=>String(x.id)===b.dataset.id
    );

    if(!s)return;

    const {error}=await supabase
     .from("store_flash_sales")
     .update({is_active:!s.is_active})
     .eq("id",s.id);

    if(error)throw error;

    await loadFlashSales();

    globalMessage("Flash sale status updated.");
   }

   if(b.dataset.action==="delete-sale"){
    if(!confirm("Are you sure you want to delete this flash sale?")){
     return;
    }

    const {error}=await supabase
     .from("store_flash_sales")
     .delete()
     .eq("id",b.dataset.id);

    if(error)throw error;

    await loadFlashSales();

    globalMessage("Flash sale deleted successfully.");
   }

  }catch(error){
   handleError(error);
  }
 });
}


/* ==========================================
   STORE CONTROL
   store_settings.id is BOOLEAN true
========================================== */

function renderStoreSettings(){
 const open=storeSettings.is_open===true;

 if(el.storeStatus){
  el.storeStatus.textContent=open
   ?"STORE OPEN"
   :"STORE CLOSED";

  el.storeStatus.className=open
   ?"store-open"
   :"store-closed";
 }

 if(el.storeDescription){
  el.storeDescription.textContent=open
   ?"Your store is currently open. Customers can browse products and place orders."
   :"Your store is currently closed. New payment initialization is blocked.";
 }

 if(el.closedMessage){
  el.closedMessage.value=storeSettings.closed_message||"";
 }

 if(el.toggleStore){
  el.toggleStore.disabled=!storeSettingsLoaded;

  el.toggleStore.textContent=open
   ?"CLOSE STORE"
   :"OPEN STORE";

  el.toggleStore.className=open
   ?"danger-button"
   :"primary-button";
 }
}


async function loadStoreSettings(){
 if(!el.storeMessage)return;

 storeSettingsLoaded=false;

 hideMessage(el.storeMessage);

 if(el.toggleStore){
  el.toggleStore.disabled=true;
  el.toggleStore.textContent="Loading...";
 }

 try{
  const {data,error}=await supabase
   .from("store_settings")
   .select("id,is_open,closed_message,updated_at")
   .eq("id",true)
   .maybeSingle();

  if(error)throw error;

  if(!data){
   throw new Error(
    "Store settings row with id = true was not found."
   );
  }

  storeSettings={
   id:data.id,
   is_open:data.is_open===true,
   closed_message:data.closed_message||"",
   updated_at:data.updated_at
  };

  storeSettingsLoaded=true;

  renderStoreSettings();

 }catch(error){
  console.error("Store settings loading error:",error);

  if(el.storeStatus){
   el.storeStatus.textContent="STATUS UNAVAILABLE";
   el.storeStatus.className="store-unavailable";
  }

  if(el.storeDescription){
   el.storeDescription.textContent=
    "The store status could not be verified. Check your database connection and store_settings row.";
  }

  if(el.toggleStore){
   el.toggleStore.disabled=true;
   el.toggleStore.textContent="Unavailable";
  }

  showMessage(
   el.storeMessage,
   "Unable to load store settings: "+error.message,
   "error"
  );
 }
}


/* SAVE CUSTOMER MAINTENANCE MESSAGE */

if(el.saveStoreMessage){
 el.saveStoreMessage.addEventListener("click",async()=>{
  hideMessage(el.storeMessage);

  if(!currentAdmin){
   showMessage(
    el.storeMessage,
    "Please sign in as an administrator.",
    "error"
   );
   return;
  }

  if(!storeSettingsLoaded){
   showMessage(
    el.storeMessage,
    "Store settings have not loaded. Refresh and try again.",
    "error"
   );
   return;
  }

  const message=el.closedMessage?.value.trim()||"";

  if(!message){
   showMessage(
    el.storeMessage,
    "Please enter a maintenance message.",
    "error"
   );
   return;
  }

  if(message.length>500){
   showMessage(
    el.storeMessage,
    "The maintenance message cannot exceed 500 characters.",
    "error"
   );
   return;
  }

  loading(
   el.saveStoreMessage,
   true,
   "Saving message..."
  );

  try{
   const {data,error}=await supabase
    .from("store_settings")
    .update({
     closed_message:message,
     updated_at:new Date().toISOString()
    })
    .eq("id",true)
    .select("id,is_open,closed_message,updated_at")
    .single();

   if(error)throw error;

   storeSettings={
    id:data.id,
    is_open:data.is_open===true,
    closed_message:data.closed_message||"",
    updated_at:data.updated_at
   };

   renderStoreSettings();

   showMessage(
    el.storeMessage,
    "Customer maintenance message saved successfully.",
    "success"
   );

  }catch(error){
   showMessage(
    el.storeMessage,
    "Unable to save the message: "+error.message,
    "error"
   );

  }finally{
   loading(el.saveStoreMessage,false);
  }
 });
}


/* OPEN OR CLOSE STORE */

if(el.toggleStore){
 el.toggleStore.addEventListener("click",async()=>{
  hideMessage(el.storeMessage);

  if(!currentAdmin){
   showMessage(
    el.storeMessage,
    "Please sign in as an administrator.",
    "error"
   );
   return;
  }

  if(!storeSettingsLoaded){
   showMessage(
    el.storeMessage,
    "Store status is unavailable. Reload settings before changing it.",
    "error"
   );
   return;
  }

  const next=!storeSettings.is_open;

  const confirmed=confirm(
   next
    ?"Open your online store? Customers will be able to place new orders."
    :"Close your online store? Customers will no longer be able to initialize new payments."
  );

  if(!confirmed)return;

  loading(
   el.toggleStore,
   true,
   "Updating store..."
  );

  try{
   const {data,error}=await supabase
    .from("store_settings")
    .update({
     is_open:next,
     updated_at:new Date().toISOString()
    })
    .eq("id",true)
    .select("id,is_open,closed_message,updated_at")
    .single();

   if(error)throw error;

   storeSettings={
    id:data.id,
    is_open:data.is_open===true,
    closed_message:data.closed_message||"",
    updated_at:data.updated_at
   };

   storeSettingsLoaded=true;

   renderStoreSettings();

   const msg=storeSettings.is_open
    ?"Your store is now OPEN. Customers can place new orders."
    :"Your store is now CLOSED. New payment initialization is blocked.";

   showMessage(el.storeMessage,msg,"success");
   globalMessage(msg);

  }catch(error){
   showMessage(
    el.storeMessage,
    "Unable to change store status: "+error.message,
    "error"
   );

   await loadStoreSettings();

  }finally{
   if(el.toggleStore){
    el.toggleStore.disabled=!storeSettingsLoaded;

    if(storeSettingsLoaded){
     renderStoreSettings();
    }
   }
  }
 });
}


/* ==========================================
   REFRESH BUTTONS
========================================== */

if(el.refreshDashboard){
 el.refreshDashboard.addEventListener("click",async()=>{
  loading(
   el.refreshDashboard,
   true,
   "Refreshing..."
  );

  try{
   await loadDashboard();
  }finally{
   loading(el.refreshDashboard,false);
  }
 });
}


if(el.refreshOrders){
 el.refreshOrders.addEventListener("click",async()=>{
  loading(
   el.refreshOrders,
   true,
   "Loading..."
  );

  try{
   await loadOrders();

   globalMessage("Orders refreshed.");

  }catch(error){
   handleError(error);

  }finally{
   loading(el.refreshOrders,false);
  }
 });
}


/* ==========================================
   START ADMIN DASHBOARD
========================================== */

restoreSession();

})();
