/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Es probable que ya tengas roots o testMatch, déjalos como están.
  
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // 🚀 ESTA ES LA MAGIA: 
        // Sobrescribimos esta regla estricta SOLO para Jest.
        // Así ts-jest puede convertir los imports a CommonJS sin que TS se queje.
        tsconfig: {
          verbatimModuleSyntax: false
        }
      }
    ]
  }
};