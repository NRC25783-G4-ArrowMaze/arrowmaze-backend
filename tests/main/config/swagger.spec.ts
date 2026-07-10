import { buildSwaggerSpec } from '../../../src/main/config/swagger.js';

describe('buildSwaggerSpec (documentación OpenAPI)', () => {
  // Valida que el glob relativo al módulo encuentra los archivos de rutas
  // y que las anotaciones @openapi de los 12 endpoints se parsean.
  const spec = buildSwaggerSpec() as any;

  it('should_produce_an_openapi_3_spec', () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toContain('Arrow Maze');
  });

  it('should_document_all_12_endpoints', () => {
    const paths = spec.paths ?? {};
    const operations = Object.values(paths).flatMap((methods: any) => Object.keys(methods));

    expect(Object.keys(paths).sort()).toEqual([
      '/auth/login',
      '/auth/logout',
      '/auth/register',
      '/leaderboards/{levelId}',
      '/levels',
      '/levels/bulk',
      '/levels/{id}',
      '/progress',
      '/progress/{levelId}'
    ]);
    expect(operations).toHaveLength(12);
  });

  it('should_declare_the_bearer_jwt_security_scheme_and_shared_schemas', () => {
    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    });
    expect(spec.components.schemas.LevelData).toBeDefined();
    expect(spec.components.schemas.LeaderboardResponse).toBeDefined();
    expect(spec.components.schemas.ErrorResponse).toBeDefined();
  });
});
