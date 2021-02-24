/**
 * @param { Promise } promise
 * @param { Object= } errorExt - Additional Information you can pass to the err object
 * @return { Promise }
 * [ err, user ] = await to(UserModel.findById(1));
 * if(!user) return cb('No user found');
 */
export function to<T, U = Error>(
  promise: Promise<T>,
  errorExt?: object,
): Promise<[U, undefined] | [null, T]> {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((err: U) => {
    if (errorExt) {
      Object.assign(err, errorExt);
    }

    return [err, undefined];
  });
}

export default to;
