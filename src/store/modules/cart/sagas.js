import { call, put, all, takeLatest, select } from 'redux-saga/effects';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import history from '../../../services/history';
import { addToCartSuccess, updateAmountSuccess } from './actions';
import { formatPrice } from '../../../util/format';

function* addToCart({ productId }) {
  const productExists = yield select(state =>
    state.cart.find(product => product.id === productId)
  );

  const stock = yield call(api.get, `/stock/${productId}`);
  const stockAmount = stock.data.amount;

  const currentAmount = productExists ? productExists.amount : 0;
  const amount = currentAmount + 1;

  if (amount > stockAmount) {
    toast.error(`Possuímos apenas ${stockAmount} unidades em estoque.`);
    return;
  }

  if (!productExists) {
    const response = yield call(api.get, `/products/${productId}`);

    const data = {
      ...response.data,
      amount: 1,
      priceFormated: formatPrice(response.data.price),
    };

    yield put(addToCartSuccess(data));

    history.push('/cart');
  }

  if (productExists) {
    yield put(updateAmountSuccess(productId, amount));
  }
}

function* updateAmount({ productId, amount }) {
  if (amount < 1) {
    toast.error(
      'A quantidade mínima não pode ser menor do que 1. Exclua o produto do carrinho.'
    );
    return;
  }

  const stock = yield call(api.get, `stock/${productId}`);
  const stockAmount = stock.data.amount;

  if (amount > stockAmount) {
    toast.error(`Possuímos apenas ${stockAmount} unidades em estoque.`);
    return;
  }

  yield put(updateAmountSuccess(productId, amount));
}

export default all([
  takeLatest('@cart/ADD_REQUEST', addToCart),
  takeLatest('@cart/UPDATE_AMOUNT_REQUEST', updateAmount),
]);
