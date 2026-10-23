export const SUPPORT_PHONE = '+256701897800';
export const validPhone = v => typeof v === 'string' && /^\+[1-9]\d{7,14}$/.test(v);
export const validEmail = v => typeof v === 'string' && v.length <= 254 && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v);
export function normalizePhone(value = '') {
  const clean = String(value).replace(/[\s()-]/g, '');
  return /^0\d{9}$/.test(clean) ? '+256' + clean.slice(1) : clean;
}
export function validateListing(input, today = new Date().toISOString().slice(0,10)) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Provide property details.');
  const out = {};
  for (const [field,max] of Object.entries({title:100,area:100,city:80,type:30,description:3000,advance:200,owner:100,deposit:200,utilities:200})) {
    const v = input[field];
    if (typeof v !== 'string' || !v.trim() || v.trim().length > max) throw new Error('Enter a valid '+field+' (up to '+max+' characters).');
    out[field] = v.trim();
  }
  if (!['Apartment','House','Bungalow','Studio','Room'].includes(out.type)) throw new Error('Choose a property type.');
  for (const [field,min,max] of [['beds',0,50],['baths',1,50],['rent',1,1000000000],['size',1,100000]]) {
    const v = input[field];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (field !== 'size' && !Number.isInteger(v))) throw new Error('Enter a valid '+field+'.');
    out[field] = v;
  }
  out.phone = normalizePhone(input.phone || '');
  out.email = typeof input.email === 'string' ? input.email.trim() : '';
  if (out.phone && !validPhone(out.phone)) throw new Error('Use a Ugandan local number or an international number starting with +.');
  if (out.email && !validEmail(out.email)) throw new Error('Enter a valid contact email.');
  if (!out.phone && !out.email) throw new Error('Provide a public owner phone number or email.');
  if (!Array.isArray(input.amenities) || input.amenities.length > 20 || input.amenities.some(v => typeof v !== 'string' || !v.trim() || v.length > 80)) throw new Error('Provide up to 20 amenities, each under 80 characters.');
  out.amenities = [...new Set(input.amenities.map(v => v.trim()))];
  if (!['available','rented','unavailable'].includes(input.availability)) throw new Error('Choose availability.');
  out.availability = input.availability;
  if (typeof input.lastConfirmed !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.lastConfirmed) || !Number.isFinite(Date.parse(input.lastConfirmed)) || new Date(input.lastConfirmed).toISOString().slice(0,10) !== input.lastConfirmed || input.lastConfirmed > today) throw new Error('Choose a valid confirmation date that is not in the future.');
  out.lastConfirmed = input.lastConfirmed;
  if (typeof input.photoId !== 'string' || !/^[a-f0-9-]{36}$/.test(input.photoId)) throw new Error('Upload a property photograph.');
  out.photoId = input.photoId;
  if (input.consent !== true) throw new Error('Confirm your authority and permission to publish the details and photo.');
  out.consent = true;
  return out;
}
export function contactState(p) {
  if (p.example) return {enabled:false,message:'This is an example home. Owner contact is unavailable.'};
  if (p.availability === 'rented') return {enabled:false,message:'This home has been rented. Enquiries are closed.'};
  if (p.availability === 'unavailable') return {enabled:false,message:'This home is currently unavailable. Enquiries are closed.'};
  if (!validPhone(p.phone) && !validEmail(p.email)) return {enabled:false,message:'Owner contact is currently unavailable. Please check back later.'};
  return {enabled:true,message:''};
}
export function selectListings(listings, filters = {}, saved = null) {
  const query = (filters.location || '').trim().toLowerCase();
  const items = listings.filter(p => (!query || (p.title+' '+p.area+' '+p.city).toLowerCase().includes(query)) && (!filters.budget || p.rent <= Number(filters.budget)) && (!filters.beds || (Number(filters.beds) === 3 ? p.beds >= 3 : p.beds === Number(filters.beds))) && (!saved || saved.includes(p.id)));
  if (filters.sort === 'low') items.sort((a,b) => a.rent-b.rent);
  if (filters.sort === 'high') items.sort((a,b) => b.rent-a.rent);
  return items;
}
export const toggleSaved = (saved,id) => saved.includes(id) ? saved.filter(v => v !== id) : [...saved,id];
export function imageType(bytes) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') return 'image/webp';
  return null;
}
