export const adminGroups = [
 {label:"Store",items:[
  {href:"/admin/dashboard",label:"Overview",icon:"overview",description:"Sales, store activity and recent orders"},
  {href:"/admin/orders",label:"Orders",icon:"orders",description:"Payments, making progress and delivery"},
  {href:"/admin/enquiries",label:"Customer chats",icon:"chats",description:"Messages, price offers and replies"},
  {href:"/admin/products",label:"Products",icon:"products",description:"Inventory, pricing and product images"},
  {href:"/admin/categories",label:"Categories",icon:"categories",description:"Product categories and pictures"},
 ]},
 {label:"Customers & growth",items:[
  {href:"/admin/promotions",label:"Promotion banners",icon:"marketing",description:"Homepage carousel and seasonal offer banners"},
  {href:"/admin/users",label:"Users",icon:"users",description:"Customer and staff accounts"},
  {href:"/admin/users?role=promoter",label:"Promoters",icon:"promoters",description:"Promoter accounts and referrals"},
  {href:"/admin/coupons",label:"Coupons & offers",icon:"coupons",description:"Discount codes and promotions"},
  {href:"/admin/reports",label:"Reports & analytics",icon:"reports",description:"Sales performance and exports"},
  {href:"/admin/return-requests",label:"Returns & disputes",icon:"returns",description:"Review returns and customer disputes"},
  {href:"/admin/marketing",label:"Marketing tools",icon:"marketing",description:"Promotional content and marketing tools"},
 ]},
 {label:"Manage",items:[
  {href:"/admin/settings",label:"Platform settings",icon:"settings",description:"Store preferences and configuration"},
  {href:"/admin/website-settings",label:"Website & branding",icon:"website",description:"Store information and website identity"},
  {href:"/support/dashboard",label:"Support desk",icon:"support",description:"Support tickets and customer assistance"},
 ]},
];
export const adminItems=adminGroups.flatMap(group=>group.items);
export function activeAdminItem(pathname:string,roleFilter:string|null){
 if(pathname==="/admin/users"&&roleFilter==="promoter")return adminItems.find(item=>item.href.includes("role=promoter"));
 return adminItems.find(item=>!item.href.includes("?")&&(pathname===item.href||pathname.startsWith(item.href+"/")));
}
export function searchAdminItems(value:string){const query=value.trim().toLowerCase();return adminItems.filter(item=>(item.label+" "+item.description).toLowerCase().includes(query));}
