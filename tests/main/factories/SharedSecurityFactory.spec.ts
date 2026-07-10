describe('SharedSecurityFactory (Singleton de las dependencias de seguridad)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: 'test-secret' };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should_return_same_token_service_instance_on_every_call', async () => {
    const { SharedSecurityFactory } = await import('../../../src/main/factories/SharedSecurityFactory.js');

    const first = SharedSecurityFactory.getTokenService();
    const second = SharedSecurityFactory.getTokenService();

    expect(first).toBe(second);
  });

  it('should_return_same_session_repository_and_auth_middleware_instances', async () => {
    const { SharedSecurityFactory } = await import('../../../src/main/factories/SharedSecurityFactory.js');

    expect(SharedSecurityFactory.getSessionRepository()).toBe(SharedSecurityFactory.getSessionRepository());
    expect(SharedSecurityFactory.getAuthMiddleware()).toBe(SharedSecurityFactory.getAuthMiddleware());
  });

  it('should_throw_when_JWT_SECRET_is_missing', async () => {
    delete process.env.JWT_SECRET;
    const { SharedSecurityFactory } = await import('../../../src/main/factories/SharedSecurityFactory.js');

    expect(() => SharedSecurityFactory.getTokenService()).toThrow('JWT_SECRET');
  });
});
