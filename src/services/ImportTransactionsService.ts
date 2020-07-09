import { getCustomRepository, getRepository, In } from 'typeorm';
import csv from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(path: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const readStream = await fs.createReadStream(path);
    const parsers = csv({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', row => {
      const [title, type, value, category] = row.map((item: string) =>
        item.trim(),
      );
      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, value, type, category });
      // essa transaction possui type como string
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    // verifica quais categorias do arquivo estão salvas no bd
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    // seleciona o title das categorias salvas
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index); // remove itens duplicados na lista

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);
    await fs.promises.unlink(path);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
