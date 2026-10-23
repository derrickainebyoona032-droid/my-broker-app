import test from 'node:test';
import assert from 'node:assert/strict';
import {validateListing,normalizePhone,contactState,selectListings,toggleSaved,imageType} from '../lib/listing.mjs';
export const fixture={title:'Test home',area:'Ntinda',city:'Kampala',type:'Apartment',beds:2,baths:1,rent:850000,size:75,description:'A test property used only in automated checks.',advance:'3 months',deposit:'UGX 850,000',utilities:'Separately metered',amenities:['Parking'],owner:'Test owner',phone:'0701897800',email:'',photoId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',availability:'available',lastConfirmed:'2026-10-20',consent:true};
test('validates complete property and normalizes Ugandan contacts',()=>{
 const data=validateListing(fixture,'2026-10-23');assert.equal(data.phone,'+256701897800');assert.equal(normalizePhone('+256 701 897 800'),data.phone);
 for(const change of [{rent:-1},{rent:'500'},{beds:1.5},{phone:'123'},{phone:'',email:''},{consent:false},{photoId:''},{availability:'booked'},{lastConfirmed:'2026-02-30'},{lastConfirmed:'2026-10-24'},{amenities:['']},{description:''}])assert.throws(()=>validateListing({...fixture,...change},'2026-10-23'));
});
test('example, missing-contact and unavailable states stay distinct',()=>{
 assert.match(contactState({...fixture,example:true}).message,/example/);
 assert.match(contactState({...fixture,phone:null,email:null}).message,/currently unavailable/);
 assert.match(contactState({...fixture,availability:'rented'}).message,/rented/);
 assert.match(contactState({...fixture,availability:'unavailable'}).message,/currently unavailable/);
 assert.equal(contactState({...fixture,phone:'+256701897800'}).enabled,true);
});
test('filters, price sorting and saved homes compose without mutating data',()=>{
 const homes=[{...fixture,id:'a'},{...fixture,id:'b',city:'Jinja',area:'Walukuba',rent:450000,beds:1},{...fixture,id:'c',rent:1200000,beds:3}];
 assert.deepEqual(selectListings(homes,{location:' JINJA ',budget:500000,beds:1}).map(p=>p.id),['b']);
 assert.equal(selectListings(homes,{location:'missing'}).length,0);
 assert.deepEqual(selectListings(homes,{sort:'low'}).map(p=>p.id),['b','a','c']);
 assert.deepEqual(selectListings(homes,{},['a']).map(p=>p.id),['a']);
 assert.deepEqual(toggleSaved(toggleSaved([],'a'),'a'),[]);
 assert.equal(homes[0].id,'a');
});
test('only supported photo signatures are accepted',()=>{
 assert.equal(imageType(Uint8Array.from([255,216,255,0])),'image/jpeg');
 assert.equal(imageType(new TextEncoder().encode('<svg></svg>')),null);
});
