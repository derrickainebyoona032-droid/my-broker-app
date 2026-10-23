import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { handleApi } from '../../../lib/api';
export const dynamic = 'force-dynamic';
async function handle(request:Request) {
  return handleApi(request,{db:env.DB,bucket:env.BUCKET,user:await getChatGPTUser(),adminEmail:'derrickainebyoona032@gmail.com'});
}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
