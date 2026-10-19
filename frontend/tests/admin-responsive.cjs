const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),assert=require('node:assert/strict'),{renderToStaticMarkup}=require('react-dom/server');
function moduleAt(filename){const context={exports:{},require:name=>require(name)};vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,context);return context.exports;}
const nav=moduleAt('src/lib/adminNavigation.ts'),Table=moduleAt('src/components/admin/AdminTable.tsx').default;let checks=0;const check=(ok,label)=>{assert.ok(ok,label);checks++;};
const before=JSON.parse(fs.readFileSync('tests/admin-features-before.json','utf8'));
for(const [filename,snapshot]of Object.entries(before)){
 const source=fs.readFileSync(filename,'utf8');
 for(const name of snapshot.handlers)check(new RegExp('\\b(?:const|function)\\s+'+name+'\\b').test(source),'handler preserved: '+filename+' '+name);
 check((source.match(/<(?:input|textarea|select)\b/g)||[]).length>=snapshot.inputs,'all form fields retained: '+filename);
 for(const call of snapshot.api_calls){
  // Catalog loading now intentionally uses the authenticated admin endpoint.
  if(filename.includes('products')&&call.startsWith('productApi.list(')){check(source.includes('adminApi.products('),'admin inventory includes hidden products');continue;}
  check(source.includes(call),'API capability preserved: '+filename+' '+call);
 }
}
const expected=['/admin/dashboard','/admin/users','/admin/users?role=promoter','/admin/products','/admin/categories','/admin/orders','/admin/enquiries','/admin/coupons','/admin/reports','/admin/return-requests','/admin/settings','/admin/marketing','/admin/website-settings','/support/dashboard'];
for(const href of expected)check(nav.adminItems.some(i=>i.href===href),'navigation retained: '+href);
check(nav.activeAdminItem('/admin/users','promoter').label==='Promoters','promoter query active state');check(nav.activeAdminItem('/admin/products/add',null).label==='Products','nested product editor active state');check(nav.searchAdminItems('delivery').some(i=>i.href==='/admin/orders'),'page finder uses task descriptions');check(nav.searchAdminItems('  ').length===nav.adminItems.length,'all pages discoverable');
let clicks=0;const handler=()=>clicks++;const row=React.createElement('tr',{key:'one'},React.createElement('td',null,'Wooden chair'),React.createElement('td',null,'INR 10,000'),React.createElement('td',null,React.createElement('button',{onClick:handler,title:'Edit product'},'Edit')));
const tree=Table({children:[React.createElement('thead',{key:'head'},React.createElement('tr',null,...['Product','Price','Actions'].map(n=>React.createElement('th',{key:n},n)))),React.createElement('tbody',{key:'body'},[row,React.createElement('tr',{key:'empty'},React.createElement('td',{colSpan:3},'No matching records'))])],'aria-label':'Products'});
const html=renderToStaticMarkup(tree);for(const label of ['Product','Price','Actions'])check(html.includes('data-label="'+label+'"'),'mobile field label: '+label);check(html.includes('data-wide="true"'),'empty row remains full width');check(html.includes('No matching records')&&html.includes('INR 10,000'),'all record content preserved');check(html.includes('aria-label="Products"')&&html.includes('role="cell"'),'accessible table and cells');
const tbody=React.Children.toArray(tree.props.children).find(c=>c.type==='tbody');const first=React.Children.toArray(tbody.props.children)[0];const action=React.Children.toArray(first.props.children)[2].props.children;check(action.props.onClick===handler,'original action identity preserved');action.props.onClick();check(clicks===1,'action remains callable');
const css=fs.readFileSync('src/app/admin/admin.css','utf8');require('postcss').parse(css);check(css.includes('@media(max-width:767px)')&&css.includes('content:attr(data-label)'),'mobile cards breakpoint');check(css.includes('@media(min-width:1024px)')&&css.includes('minmax(0,1fr)'),'desktop navigation and fluid grids');check(css.includes('@media print'),'print view retained');
console.log(checks+' admin checks passed: existing fields/API actions preserved, all navigation routes, page search, shared desktop/mobile record content, callable actions, CSS and print rules.');
