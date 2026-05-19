# troubleshoot-login

Check Keycloak config, redirect URI, token storage, route guard, browser console and network calls.

Local dev defaults to Keycloak with `environment.keycloak.enabled: true` so login,
logout and 401 redirects use the real identity provider. Only set it to `false`
for an intentional local bypass; with bypass enabled, logout cannot redirect
through the Keycloak session. Production must keep this flag enabled so redirects
and tokens still come from Keycloak.
