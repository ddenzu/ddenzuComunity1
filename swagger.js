const swaggerAutogen = require('swagger-autogen')({ language: 'ko' });

const doc = {
  swaggerDefinition: {
    openapi: '3.0.0', 
    info: {
      title: 'API', 
      version: '1.0.0', 
      description: 'a REST API using swagger and express.', 
    },
    servers: [
      {
        url: 'https://localhost:8080', 
      },
    ],
  },
  apis: [],
};
const outputFile = './swagger-output.json' 
const endpointsFiles = ['./server.js'] 

swaggerAutogen(outputFile, endpointsFiles, doc);