/** Storage validation is shared by manual entry, edits and native integrations. */
export function validVolume(value:number|null,allowZero=false):boolean {
 return value===null || Number.isFinite(value)&&value<=Number.MAX_SAFE_INTEGER&&(allowZero?value>=0:value>0);
}
export function validLoggedDate(value:string|Date,now=new Date()):boolean {
 const date=value instanceof Date?value:new Date(value);
 return Number.isFinite(date.getTime())&&date<=now;
}
