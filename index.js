import puppeteer from 'puppeteer';
import fs from 'fs';
import converter from 'json-2-csv';

const URL = 'https://belgorod.hh.ru/search/vacancy?search_field=name&search_field=company_name&search_field=description&fromSearchLine=true&text=Html-%D0%B2%D0%B5%D1%80%D1%81%D1%82%D0%B0%D0%BB%D1%8C%D1%89%D0%B8%D0%BA&from=suggest_post&hhtmFrom=vacancy_search_list&page=';

async function scrape() {
	let counter = 0;
	let  res = [];
	let notLastPage = true;

	/*{
		headless: false,
		slowMo: 100,
		devtools: true,
	}*/

	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		while (notLastPage) {
			await page.goto(`${URL}${counter}`, {
				waitUntil: 'domcontentloaded'
			});
			let html = await page.evaluate(async () => {
				let page = []
				try {
					const items = document.querySelectorAll('.vacancy-serp-item');
					console.log(items);
					for (const item of items) {
						const title = item.querySelector('[data-qa="vacancy-serp__vacancy-title"]').textContent;
						const price = item.querySelector('[data-qa="vacancy-serp__vacancy-compensation"]');
						const link = item.querySelector('[data-qa="vacancy-serp__vacancy-title"]').href;
						const company = item.querySelector('[data-qa="vacancy-serp__vacancy-employer"]').textContent;
						
						page.push({
							title,
							price: price !== null ? price.textContent : 'NO-PRICE',
							link,
							company, 
						})

					}
				} catch (error) {
					throw error
				}
				return page
			}, { waitUntil:  'domcontentloaded' })

			res.push(html);

			for (let i in res) {
				if (res[i].length === 0) {
					notLastPage = false
				}
			}
			counter++
		}
		return res.flat();
	} catch (e) {
		throw e
	}
};

scrape().then(result => {
	fs.writeFile('hh.json', JSON.stringify(result, null, 2), err => {
		if (err) {throw err} else {console.log('File saved');}
	})
	converter.json2csv(result, function (err, csv) {
		fs.writeFileSync(`hh.csv`, csv)
	})
});
