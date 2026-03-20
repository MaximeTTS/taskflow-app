import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: {
              module: 'commonjs',
            },
          },
        ],
      },
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      moduleNameMapper: {
        '^@/generated/prisma/client$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@/generated/(.*)$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@prisma/adapter-pg$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@/lib/prisma$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: {
              module: 'commonjs',
            },
          },
        ],
      },
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      moduleNameMapper: {
        '^@/generated/prisma/client$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@/generated/(.*)$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@prisma/adapter-pg$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@/lib/prisma$': '<rootDir>/src/__tests__/__mocks__/prisma.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

export default config;
