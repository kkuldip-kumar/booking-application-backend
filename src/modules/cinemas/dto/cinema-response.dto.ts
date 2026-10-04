import { CinemaStatus } from '../../../common/enums/cinema.enums';
import { Cinema } from '../entities/cinema.entity';
import { CinemaImageResponseDto } from './cinema-image.dto';

const TIME_HH_MM_LENGTH = 5;

export class CinemaResponseDto {
  id!: string;
  code!: string;
  name!: string;
  addressLine!: string;
  city!: string;
  state!: string;
  country!: string;
  postalCode!: string;
  latitude!: number | null;
  longitude!: number | null;
  timezone!: string;
  phone!: string | null;
  email!: string | null;
  openingTime!: string;
  closingTime!: string;
  facilities!: string[];
  status!: CinemaStatus;
  images?: CinemaImageResponseDto[];

  static from(cinema: Cinema): CinemaResponseDto {
    return {
      id: cinema.id, code: cinema.code, name: cinema.name, addressLine: cinema.addressLine,
      city: cinema.city, state: cinema.state, country: cinema.country, postalCode: cinema.postalCode,
      latitude: cinema.latitude, longitude: cinema.longitude, timezone: cinema.timezone,
      phone: cinema.phone, email: cinema.email,
      openingTime: cinema.openingTime.slice(0, TIME_HH_MM_LENGTH),
      closingTime: cinema.closingTime.slice(0, TIME_HH_MM_LENGTH),
      facilities: cinema.facilities, status: cinema.status,
      images: cinema.images?.map((image) => CinemaImageResponseDto.from(image)),
    };
  }
}
