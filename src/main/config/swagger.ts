import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Construye el spec OpenAPI leyendo las anotaciones @openapi de los
 * archivos de rutas. Los globs son relativos a process.cwd() y usan
 * siempre '/' como separador: el glob interno de swagger-jsdoc no
 * acepta '\' de Windows (path.resolve rompía la búsqueda ahí). Cubren
 * tanto src/ (dev con tsx) como dist/ (producción; los JSDoc sobreviven
 * al build porque tsc no elimina comentarios).
 */
export function buildSwaggerSpec(): object {
  const routesGlobs = [
    'src/presentation/routes/*.{ts,js}',
    'dist/presentation/routes/*.{ts,js}'
  ];

  return swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Arrow Maze — Backend API',
        version: '1.0.0',
        description:
          'API REST del juego de puzzles Arrow Maze: autenticación (JWT), distribución de niveles, progreso del jugador y leaderboards por nivel.'
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          ErrorResponse: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          },
          RegisterRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', format: 'password' }
            }
          },
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', format: 'password' }
            }
          },
          LoginResponse: {
            type: 'object',
            properties: {
              token: { type: 'string', description: 'JWT válido por 7 días' }
            }
          },
          LevelMetadata: {
            type: 'object',
            required: ['id', 'allowedMoves'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              difficulty: { type: 'string' },
              allowedMoves: { type: 'integer' }
            }
          },
          LevelCell: {
            type: 'object',
            required: ['id', 'portCount'],
            properties: {
              id: { type: 'string' },
              portCount: { type: 'integer' }
            }
          },
          LevelConnection: {
            type: 'object',
            required: ['fromCell', 'fromPort', 'toCell', 'toPort'],
            properties: {
              fromCell: { type: 'string' },
              fromPort: { type: 'integer' },
              toCell: { type: 'string' },
              toPort: { type: 'integer' }
            }
          },
          LevelArrow: {
            type: 'object',
            required: ['id', 'head', 'body'],
            properties: {
              id: { type: 'string' },
              head: {
                type: 'object',
                required: ['cellId', 'exitPort'],
                properties: {
                  cellId: { type: 'string' },
                  exitPort: { type: 'integer' }
                }
              },
              body: { type: 'array', items: { type: 'string' } }
            }
          },
          LevelData: {
            type: 'object',
            required: ['id', 'allowedMoves', 'arrows', 'cells'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              difficulty: { type: 'string' },
              allowedMoves: { type: 'integer' },
              arrows: { type: 'array', items: { $ref: '#/components/schemas/LevelArrow' } },
              cells: { type: 'array', items: { $ref: '#/components/schemas/LevelCell' } },
              connections: { type: 'array', items: { $ref: '#/components/schemas/LevelConnection' } }
            }
          },
          SaveProgressPayload: {
            type: 'object',
            required: ['levelId', 'score', 'movesUsed', 'timeElapsedSeconds'],
            properties: {
              levelId: { type: 'string' },
              score: { type: 'integer' },
              movesUsed: { type: 'integer' },
              timeElapsedSeconds: { type: 'number' }
            }
          },
          LevelProgress: {
            type: 'object',
            properties: {
              levelId: { type: 'string' },
              userId: { type: 'string' },
              score: { type: 'integer' },
              movesUsed: { type: 'integer' },
              timeElapsedSeconds: { type: 'number' },
              achievedAt: { type: 'string', format: 'date-time' }
            }
          },
          LeaderboardEntry: {
            type: 'object',
            properties: {
              rank: { type: 'integer' },
              username: { type: 'string' },
              score: { type: 'integer' },
              movesUsed: { type: 'integer' },
              timeElapsedSeconds: { type: 'number' },
              achievedAt: { type: 'string', format: 'date-time' }
            }
          },
          LeaderboardResponse: {
            type: 'object',
            properties: {
              topPlayers: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } },
              currentRecord: {
                oneOf: [{ $ref: '#/components/schemas/LeaderboardEntry' }, { type: 'null' }],
                nullable: true
              }
            }
          }
        }
      }
    },
    apis: routesGlobs
  });
}
