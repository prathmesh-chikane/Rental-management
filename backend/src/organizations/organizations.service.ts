import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

// MongoDB Model inject करण्यासाठी
import { InjectModel } from '@nestjs/mongoose';

// Mongoose मधील Model type
import { Model } from 'mongoose';

// Organization Schema आणि Document type
import {
    Organization,
    OrganizationDocument,
} from './schemas/organization.schema.js';

@Injectable()
export class OrganizationsService {
    // Organization MongoDB Model
    // या Model च्या मदतीने आपण Database मध्ये CRUD operations करू शकतो
    constructor(
        @InjectModel(Organization.name)
        private readonly organizationModel: Model<OrganizationDocument>,
    ) { }

    // 1. नवीन Organization तयार करणे
    async create(data: Partial<Organization>) {
        // दिलेल्या Data वरून नवीन Organization तयार करतो
        const organization = new this.organizationModel(data);

        // Organization MongoDB मध्ये Save करतो
        return await organization.save();
    }

    // 2. सर्व Organizations मिळवणे
    async findAll() {
        // MongoDB मधील सर्व Organizations शोधतो
        return await this.organizationModel.find().exec();
    }

    // 3. ID वापरून एक Organization शोधणे
    async findOne(id: string) {
        // दिलेल्या ID नुसार Organization शोधतो
        const organization = await this.organizationModel
            .findById(id)
            .exec();

        // Organization सापडला नाही तर 404 error देतो
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        // Organization मिळाल्यास तो return करतो
        return organization;
    }

    // 4. Organization Update करणे
    async update(id: string, data: Partial<Organization>) {
        // ID नुसार Organization शोधून त्याचा Data Update करतो
        const organization = await this.organizationModel
            .findByIdAndUpdate(
                id,
                data,
                {
                    new: true, // Update झालेला नवीन Data return करतो
                    runValidators: true, // Schema मधील validators तपासतो
                },
            )
            .exec();

        // Organization सापडला नाही तर 404 error
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        return organization;
    }

    // 5. Organization Delete करणे
    async remove(id: string) {
        // ID नुसार Organization Delete करतो
        const organization = await this.organizationModel
            .findByIdAndDelete(id)
            .exec();

        // Organization सापडला नाही तर 404 error
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        return {
            message: 'Organization deleted successfully',
        };
    }
}
