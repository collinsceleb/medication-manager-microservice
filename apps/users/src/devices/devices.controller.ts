import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @MessagePattern('createDevice')
  create(@Payload() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @MessagePattern('findAllDevices')
  findAll() {
    return this.devicesService.findAll();
  }

  @MessagePattern('findOneDevice')
  findOne(@Payload() id: number) {
    return this.devicesService.findOne(id);
  }

  @MessagePattern('updateDevice')
  update(@Payload() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(updateDeviceDto.id, updateDeviceDto);
  }

  @MessagePattern('removeDevice')
  remove(@Payload() id: number) {
    return this.devicesService.remove(id);
  }
}
