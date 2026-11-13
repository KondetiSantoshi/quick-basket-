import { handleApiRequest } from '@/lib/apiBridge';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleApiRequest(request);
}

export async function POST(request) {
  return handleApiRequest(request);
}

export async function PUT(request) {
  return handleApiRequest(request);
}

export async function DELETE(request) {
  return handleApiRequest(request);
}

export async function PATCH(request) {
  return handleApiRequest(request);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
