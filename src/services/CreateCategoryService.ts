import { getRepository } from 'typeorm';

import Category from '../models/Category';

import AppError from '../errors/AppError';

interface Request {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const categoryExists = categoryRepository.findOne({ where: { title } });

    if (categoryExists) {
      throw new AppError('Category already registered');
    }

    const category = await categoryRepository.create({ title });

    return category;
  }
}

export default CreateCategoryService;
