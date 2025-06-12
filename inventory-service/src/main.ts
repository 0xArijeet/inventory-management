import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the HTTP app
  const app = await NestFactory.create(AppModule);

  // Connect to NATS
  const microservice = app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: ['nats://localhost:4222'],
    },
  });

  // Start both HTTP and microservice
  await app.startAllMicroservices();
  await app.listen(3001);
  
  console.log('Inventory service is running on port 3001');
  console.log('Inventory microservice is listening for NATS messages');
}
bootstrap();
