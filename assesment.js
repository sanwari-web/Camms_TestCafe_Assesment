import { Selector } from 'testcafe';
import XPathSelector from './xpath_selector';

//set the starting URL
fixture('CammsAssesment')
    .page('https://www.saucedemo.com/');


//Generate random string first name 
const firstname = Math.random().toString(36).substring(2,7);

//Generate random string Postal code 
const postalcode = Math.random().toString(36).slice(2, 7);


const pageHeader  = XPathSelector('//span[text()="Products"]');
const productprice  = XPathSelector('//div[text()="Sauce Labs Fleece Jacket"]/../../following::div[text()="49.99"]');
const product1  = XPathSelector('//div[@class="cart_item"]//child::div[text()="Sauce Labs Fleece Jacket"]');
const product2  = XPathSelector('//div[@class="cart_item"]//child::div[text()="Sauce Labs Backpack"]');

//Declare the testcase with test method
test('CammsTestCafe_Assesment', async t => {
    await t
        //Enter User name 
        .typeText('#user-name', 'performance_glitch_user')
        //Enter password 
        .typeText('#password', 'secret_sauce')
        //Click LogIn button 
        .click('#login-button')

        //Verify the nevigated page header
        .expect((pageHeader).innerText).eql('PRODUCTS')

        //Verify the price of product Sauce Labs Fleece Jacket  
        .expect((productprice).innerText).eql('$49.99')

        //Click two products to the cart
        .click('#add-to-cart-sauce-labs-fleece-jacket')
        .click('#add-to-cart-sauce-labs-backpack')

        //Click Shopping Cart Icon
        .click('#shopping_cart_container')

        //Verify that selected products in the cart
        .expect((product1).innerText).eql('Sauce Labs Fleece Jacket')
        .expect((product2).innerText).eql('Sauce Labs Backpack')

        //Click Checkout Button
        .click('#checkout')

        //Enter first name
        .typeText('#first-name', firstname)

        //Enter last name
        .typeText('#last-name', 'camms_user')

        //Enter postal code
        .typeText('#postal-code', postalcode )

        //Click continue button
        .click('#continue')

        //Click finish button
        .click('#finish');

});