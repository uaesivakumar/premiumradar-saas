/**
 * OS Control Plane Proxy: resolve-config
 *
 * GET /api/os/resolve-config?tenant_id=...&workspace_id=...
 *
 * Proxies to UPR OS /api/os/resolve-config endpoint.
 * Used by Super Admin Control Plane UI to verify runtime configuration.
 */

import { validateSuperAdminSession } from '@/lib/superadmin-auth';

const OS_BASE_URL = process.env.UPR_OS_BASE_URL || 'http://localhost:3001';
const OS_TOKEN = process.env.UPR_OS_TOKEN;

export async function GET(request: Request) {
  // Require Super Admin session
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenant_id = searchParams.get('tenant_id');
  const workspace_id = searchParams.get('workspace_id');

  if (!tenant_id || !workspace_id) {
    return Response.json({
      success: false,
      error: 'missing_params',
      message: 'tenant_id and workspace_id are required',
    }, { status: 400 });
  }

  try {
    const osUrl = `${OS_BASE_URL}/api/os/resolve-config?tenant_id=${encodeURIComponent(tenant_id)}&workspace_id=${encodeURIComponent(workspace_id)}`;

    const response = await fetch(osUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(OS_TOKEN && { 'x-pr-os-token': OS_TOKEN }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        success: false,
        error: data.error || 'os_error',
        message: data.message || 'Failed to resolve config from OS',
      }, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[resolve-config proxy] Error:', error);
    return Response.json({
      success: false,
      error: 'proxy_error',
      message: 'Failed to connect to OS',
    }, { status: 502 });
  }
}
