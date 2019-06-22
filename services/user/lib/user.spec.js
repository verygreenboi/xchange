const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const rewire = require('rewire');

const mongoose = require('mongoose');
let users = rewire('./user');

const sandbox = sinon.createSandbox();

describe('Users', () => {

    let findStub, sampleArgs, sampleUser;

    beforeEach(() => {
        sampleUser = {
            id: '123',
            username: 'abcd',
            email: 'abcd@efgh.com',
            token: 'xyz',
            save: sandbox.stub().resolves()
        }
        findStub = sandbox.stub(mongoose.Model, 'findById').resolves(sampleUser);
    })

    afterEach(() => {
        sandbox.restore();
        users = rewire('./user');
    })

    context('Get user', () => {
        
        it ('should check if an id exists', async () => {
            try {
                await users.get(null);
            } catch (err) {
                expect(err).to.exist;
                expect(err.message).to.eq('No id passed');
                expect(findStub).to.not.have.been.called;
                expect(err).to.exist;
            }
        })

        it ('should get user when id is passed', async () => {
            const user = await users.get('123');
            expect(findStub).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith('123');
            expect(user.id).to.eq(sampleUser.id);
        })

        it ('should throw an error if user is not found', async () => {
            findStub.resolves(null);
            const user = await users.get('234');
            expect(findStub).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith('234');
            expect(user).to.be.null;
        })
    
    })

    context('Create user', () => {
        let FakeUserClass, saveStub, result;

        beforeEach(async () => {
            saveStub = sandbox.stub().resolves(sampleUser);
            
            sampleUser = {
                ...sampleUser,
                password: '123'
            }
            delete sampleUser.token;
            delete sampleUser.id;
            delete sampleUser.save;

            FakeUserClass = sandbox.stub().returns({save: saveStub});

            users.__set__('User', FakeUserClass);
            result = await users.create(sampleUser);
        })

        it ('should not create user if args are invalid', async () => {
            await expect(users.create()).to.be.rejectedWith('No arguments passed');
            await expect(users.create({username: 'adam'})).to.be.rejectedWith('Invalid args. Email and password are required.');
            await expect(users.create({email: 'adam@123.com'})).to.be.rejectedWith('Invalid args. Username and password are required.');
            await expect(users.create({password: '123'})).to.be.rejectedWith('Invalid args. Username and email are required.');
            await expect(users.create({username: 'adam', password: '123'})).to.be.rejectedWith('Invalid args. Email is required.');
            await expect(users.create({email: 'adam@123.com', password: '123'})).to.be.rejectedWith('Invalid args. Username is required.');
            await expect(users.create({email: 'adam@123.com', username: 'adam'})).to.be.rejectedWith('Invalid args. Password is required.');
            await expect(
                users.create(
                    {
                        email: '123@123.com', 
                        username: 'adam', 
                        password: '123'
                    }
                )
            ).to.be.rejectedWith('Invalid args. Password is invalid. Password cannot be part of your email.');
            await expect(
                users.create(
                    {
                        email: 'AbC@123.com', 
                        username: 'adam', 
                        password: 'abc'
                    }
                )
            ).to.be.rejectedWith('Invalid args. Password is invalid. Password cannot be part of your email.');
            await expect(
                users.create({
                    email: '123@123.com', 
                    username: 'adam', 
                    password: 'adam'
                })
            ).to.be.rejectedWith('Invalid args. Password is invalid. Password cannot be part of your username.');
            await expect(
                users.create({
                    email: '123@123.com', 
                    username: 'Adam', 
                    password: 'adam'
                })
            ).to.be.rejectedWith('Invalid args. Password is invalid. Password cannot be part of your username.');
        })

        it ('should call user with new keyword', async () => {
            await expect(FakeUserClass).to.have.been.calledWithNew;
            await expect(FakeUserClass).to.have.been.calledWith(sampleUser);
        })

        it ('should save the user', async () => {
            await expect(saveStub).to.have.been.called;
            await expect(result.email).to.eq(sampleUser.email);
        })

        it ('should reject errors', async () => {
            saveStub.rejects(new Error('rejected'));
            await expect(users.create(sampleUser)).to.eventually.be.rejectedWith('rejected');
        })
    })

    context('Delete user', () => {
        it ('should find user by id', async () => {
            await users.delete(123);
            expect(findStub).to.have.been.calledWith(123);
        })

        it ('should expect user.save to be called', async () => {
            await users.delete(123);
            expect(sampleUser.save).to.have.been.calledOnce;
        })

        it ('should reject if id is not passed', async () => {
            await expect(users.delete(null)).to.eventually.be.rejectedWith('No id passed');
        })

        it ('should catch errors on find', async () => {
            findStub.throws('No User found');
            await expect(users.delete(123)).to.eventually.be.rejectedWith('No User found');
        })
        it ('should catch errors on save', async () => {
            sampleUser.save.throws('Could not save user');
            await expect(users.delete(123)).to.eventually.be.rejectedWith('Could not save user');
        })
    })

})