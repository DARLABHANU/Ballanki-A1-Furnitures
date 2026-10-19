"use client";
import {Children,cloneElement,isValidElement,ReactNode,ReactElement,TableHTMLAttributes} from "react";
type ElementProps={children?:ReactNode;colSpan?:number;className?:string;[key:string]:unknown};
function text(node:ReactNode):string{return Children.toArray(node).map(child=>typeof child==="string"||typeof child==="number"?String(child):isValidElement<ElementProps>(child)?text(child.props.children):"").join(" ").trim();}
// Keep the same cells, children, event handlers and controls in both layouts.
export default function AdminTable({children,className,...props}:TableHTMLAttributes<HTMLTableElement>){
 const sections=Children.toArray(children);const head=sections.find(child=>isValidElement(child)&&child.type==="thead") as ReactElement<ElementProps>|undefined;
 const headerRows=head?Children.toArray(head.props.children):[];const row=headerRows.find(child=>isValidElement(child)&&child.type==="tr") as ReactElement<ElementProps>|undefined;
 const labels=row?Children.toArray(row.props.children).map(cell=>isValidElement<ElementProps>(cell)?text(cell.props.children):""):[];
 const content=sections.map(section=>{
  if(!isValidElement<ElementProps>(section)||section.type!=="tbody")return section;
  return cloneElement(section,{role:"rowgroup"},Children.map(section.props.children,row=>{
   if(!isValidElement<ElementProps>(row)||row.type!=="tr")return row;
   return cloneElement(row,{role:"row"},Children.map(row.props.children,(cell,index)=>{
    if(!isValidElement<ElementProps>(cell)||cell.type!=="td")return cell;
    const wide=(cell.props.colSpan||1)>1;
    return cloneElement(cell,{role:"cell","data-label":wide?undefined:labels[index],"data-wide":wide?"true":undefined});
   }));
  }));
 });
 return <table {...props} role={props.role||"table"} className={`admin-records-table ${className||""}`}>{content}</table>;
}
