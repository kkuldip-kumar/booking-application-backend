import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { slugify } from '../src/common/utils/slugify';
import AppDataSource from '../src/database/data-source';
import { City } from '../src/modules/cities/entities/city.entity';

const logger = new Logger('SeedCities');

/** Top 2 cities (by population / prominence) for each Indian state and UT. */
const CITIES: ReadonlyArray<{ readonly name: string; readonly state: string }> = [
  // States
  { name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { name: 'Vijayawada', state: 'Andhra Pradesh' },
  { name: 'Itanagar', state: 'Arunachal Pradesh' },
  { name: 'Naharlagun', state: 'Arunachal Pradesh' },
  { name: 'Guwahati', state: 'Assam' },
  { name: 'Silchar', state: 'Assam' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Gaya', state: 'Bihar' },
  { name: 'Raipur', state: 'Chhattisgarh' },
  { name: 'Bhilai', state: 'Chhattisgarh' },
  { name: 'Panaji', state: 'Goa' },
  { name: 'Margao', state: 'Goa' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Faridabad', state: 'Haryana' },
  { name: 'Gurugram', state: 'Haryana' },
  { name: 'Shimla', state: 'Himachal Pradesh' },
  { name: 'Dharamshala', state: 'Himachal Pradesh' },
  { name: 'Ranchi', state: 'Jharkhand' },
  { name: 'Jamshedpur', state: 'Jharkhand' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Mysuru', state: 'Karnataka' },
  { name: 'Thiruvananthapuram', state: 'Kerala' },
  { name: 'Kochi', state: 'Kerala' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Imphal', state: 'Manipur' },
  { name: 'Thoubal', state: 'Manipur' },
  { name: 'Shillong', state: 'Meghalaya' },
  { name: 'Tura', state: 'Meghalaya' },
  { name: 'Aizawl', state: 'Mizoram' },
  { name: 'Lunglei', state: 'Mizoram' },
  { name: 'Dimapur', state: 'Nagaland' },
  { name: 'Kohima', state: 'Nagaland' },
  { name: 'Bhubaneswar', state: 'Odisha' },
  { name: 'Cuttack', state: 'Odisha' },
  { name: 'Ludhiana', state: 'Punjab' },
  { name: 'Amritsar', state: 'Punjab' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Gangtok', state: 'Sikkim' },
  { name: 'Namchi', state: 'Sikkim' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Warangal', state: 'Telangana' },
  { name: 'Agartala', state: 'Tripura' },
  { name: 'Udaipur', state: 'Tripura' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Dehradun', state: 'Uttarakhand' },
  { name: 'Haridwar', state: 'Uttarakhand' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Howrah', state: 'West Bengal' },

  // Union Territories
  { name: 'Port Blair', state: 'Andaman and Nicobar Islands' },
  { name: 'Diglipur', state: 'Andaman and Nicobar Islands' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Manimajra', state: 'Chandigarh' },
  { name: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu' },
  { name: 'Silvassa', state: 'Dadra and Nagar Haveli and Daman and Diu' },
  { name: 'New Delhi', state: 'Delhi' },
  { name: 'Dwarka', state: 'Delhi' },
  { name: 'Srinagar', state: 'Jammu and Kashmir' },
  { name: 'Jammu', state: 'Jammu and Kashmir' },
  { name: 'Leh', state: 'Ladakh' },
  { name: 'Kargil', state: 'Ladakh' },
  { name: 'Kavaratti', state: 'Lakshadweep' },
  { name: 'Andrott', state: 'Lakshadweep' },
  { name: 'Puducherry', state: 'Puducherry' },
  { name: 'Karaikal', state: 'Puducherry' },
];

async function seedCities(): Promise<{ created: number; skipped: number }> {
  const repo = AppDataSource.getRepository(City);
  let created = 0;
  let skipped = 0;

  for (const row of CITIES) {
    const slug = slugify(row.name);
    const exists = await repo.exists({
      where: [{ name: row.name }, { slug }],
    });
    if (exists) {
      skipped += 1;
      continue;
    }
    await repo.save(
      repo.create({
        name: row.name,
        slug,
        state: row.state,
        isActive: true,
      }),
    );
    created += 1;
  }

  return { created, skipped };
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  const { created, skipped } = await seedCities();
  await AppDataSource.destroy();
  logger.log(`Cities seed complete: ${created} created, ${skipped} skipped (${CITIES.length} total)`);
}

main().catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : 'Cities seed failed');
  process.exit(1);
});
