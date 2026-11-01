import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'
import { STORAGE_KEY, createQuotation, readQuotationReport } from '../mocks/storage'
import { parseQuotation } from './records'
import { validateAndBuildInput } from './rules'
import { sampleDraft } from './types'
import { propertyProducts } from './products'
const server=setupServer(...handlers)
let memory:Map<string,string>
beforeEach(()=>{memory=new Map();vi.stubGlobal('location',new URL('http://localhost/'));vi.stubGlobal('localStorage',{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)});server.listen({onUnhandledFrame:'error'})})
afterEach(()=>{server.close();vi.unstubAllGlobals()})
function input(code:'BASIC_PROPERTY'|'EXTENDED_PROPERTY'='EXTENDED_PROPERTY') {const result=validateAndBuildInput({...sampleDraft(),startDate:'2024-02-01',endDate:code==='EXTENDED_PROPERTY'?'2024-07-30':'2025-01-31'},code);if(!result.success)throw new Error(result.message);return result.data}
function legacy() {const saved=createQuotation(input('BASIC_PROPERTY'));const {schemaVersion:_,productVersion:__,productSnapshot:___,product:____,...old}=saved;return old}
it('POST A/B tra mã/phiên bản, bỏ tên/rate/phí client; GET giữ bản đã phát hành',async()=>{
  for(const code of ['BASIC_PROPERTY','EXTENDED_PROPERTY'] as const){const response=await fetch('http://localhost/api/quotations',{method:'POST',body:JSON.stringify({...input(code),productName:'Giả',annualRate:9,productSnapshot:{name:'Giả'},premium:{total:1}})});expect(response.status).toBe(201);const saved=await response.json();expect(saved.productSnapshot.name).not.toBe('Giả');expect(saved.premium.total).toBe(code==='EXTENDED_PROPERTY'?813699:1100000);expect(saved.productVersion).toBe(1);expect(await(await fetch('http://localhost/api/quotations/'+saved.id)).json()).toEqual(saved)}
})
it.each([{product:'UNKNOWN',productVersion:1},{product:'EXTENDED_PROPERTY',productVersion:99},{product:'BASIC_PROPERTY',productVersion:null},{product:'BASIC_PROPERTY',productVersion:undefined},{product:undefined,productVersion:1}])('POST từ chối mã/phiên bản thiếu hoặc sai: %j',async patch=>{
  const response=await fetch('http://localhost/api/quotations',{method:'POST',body:JSON.stringify({...input(),...patch})});expect(response.status).toBe(422);expect(memory.size).toBe(0)
})
it('catalog hoạt động thay đổi không đổi phí/tên/biểu phí lịch sử khi GET, không ghi storage',async()=>{
  const saved=createQuotation(input());const raw=memory.get(STORAGE_KEY);const b=propertyProducts[1],rate=b.annualRate,name=b.name
  try{b.annualRate=.005;b.name='Tên mới';const response=await fetch('http://localhost/api/quotations/'+saved.id);expect(await response.json()).toEqual(saved);expect(memory.get(STORAGE_KEY)).toBe(raw)}finally{b.annualRate=rate;b.name=name}
})
it('adapter chỉ nhận A gốc đúng shape; không fallback metadata thiếu một phần/mã sai',()=>{
  const old=legacy();expect(parseQuotation(old)).toMatchObject({product:'BASIC_PROPERTY',productVersion:1,premium:{total:1100000}})
  expect(parseQuotation({...old,product:'BASIC_PROPERTY'})).toBeTruthy()
  for(const patch of [{product:'EXTENDED_PROPERTY'},{product:'UNKNOWN'},{product:null},{schemaVersion:2},{productVersion:1},{productSnapshot:{}},{premium:{...old.premium,total:1}}])expect(parseQuotation({...old,...patch})).toBeNull()
})
it('một row sai không làm sập list; đọc không ghi lại, POST giữ nguyên row sai và A cũ',async()=>{
  const old=legacy(),bad={id:'broken',product:'UNKNOWN'};const original=JSON.stringify({version:1,quotations:[bad,old]});memory.set(STORAGE_KEY,original)
  const response=await fetch('http://localhost/api/quotations');expect(response.status).toBe(200);expect(response.headers.get('X-Quotation-Skipped')).toBe('1');expect(await response.json()).toHaveLength(1);expect(memory.get(STORAGE_KEY)).toBe(original)
  expect(readQuotationReport().skipped).toBe(1);createQuotation(input());const stored=JSON.parse(memory.get(STORAGE_KEY)!);expect(stored.quotations.slice(0,2)).toEqual([bad,old]);expect(stored.quotations).toHaveLength(3)
})
