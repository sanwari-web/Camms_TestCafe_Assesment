import { Selector } from 'testcafe';
import XPathSelector from './xpath_selector';

fixture('CammsAssesment')
    .page('https://www.saucedemo.com/');

    // program to generate random strings

const firstname = Math.random().toString(36).substring(2,7);
const postalcode = Math.random().toString(36).slice(2, 7);
const pageHeader  = XPathSelector('//span[text()="Products"]');
const productprice  = XPathSelector('//div[text()="Sauce Labs Fleece Jacket"]/../../following::div[text()="49.99"]');
const product1  = XPathSelector('//div[@class="cart_item"]//child::div[text()="Sauce Labs Fleece Jacket"]');
const product2  = XPathSelector('//div[@class="cart_item"]//child::div[text()="Sauce Labs Backpack"]');

test('CammsTestCafe_Assesment', async t => {
    await t
        .typeText('#user-name', 'performance_glitch_user')
        .typeText('#password', 'secret_sauce')
        .click('#login-button')
        .expect((pageHeader).innerText).eql('PRODUCTS')
        .expect((productprice).innerText).eql('$49.99')
        .click('#add-to-cart-sauce-labs-fleece-jacket')
        .click('#add-to-cart-sauce-labs-backpack')
        .click('#shopping_cart_container')
        .expect((product1).innerText).eql('Sauce Labs Fleece Jacket')
        .expect((product2).innerText).eql('Sauce Labs Backpack')
        .click('#checkout')
        .typeText('#first-name', firstname)
        .typeText('#last-name', 'camms_user')
        .typeText('#postal-code', postalcode )
        .click('#continue')
        .click('#finish');

});