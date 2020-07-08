import { Router, Request, Response } from 'express';

import CreateCategoryService from '../services/CreateCategoryService';
import Category from '../models/Category';

const categoriesRoutes = Router();

categoriesRoutes.post(
  '/categories',
  async (request, response): Promise<Category> => {
    const { title } = request.body;

    const createCategory = new CreateCategoryService();

    const category = await createCategory.execute({ title });

    return response.json(category);
  },
);

categoriesRoutes.get(
  '/cagegories',
  (request: Request, response: Response) => {},
);
