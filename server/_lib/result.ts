// oxlint-disable unicorn/consistent-function-scoping
type Ok<T> = {
	is_err: false;
	value: T;
};

type Err<E> = {
	is_err: true;
	error: E;
};

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Result<T, never> {
	return { is_err: false, value };
}

export function err<E>(error: E): Result<never, E> {
	return { is_err: true, error };
}

export async function safe<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
	try {
		const data = await promise;
		return ok(data);
	} catch (error) {
		return err(error as E);
	}
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest;

	it('returns a successful result with the provided data', () => {
		const result = ok(123);
		if (result.is_err) return;

		expect(result.value).toBe(123);
	});

	it('returns an error result with the provided error', () => {
		const result = err(new Error('message'));
		if (!result.is_err) return;

		expect(result.error).toBeInstanceOf(Error);
		expect(result.error.message).toBe('message');
	});

	it('should handle division operation with both success and error cases', () => {
		const division = (a: number, b: number) => {
			if (b === 0) return err(new Error('division by zero'));
			return ok(a / b);
		};

		const result1 = division(2, 0);
		if (result1.is_err) {
			expect(result1.error).toBeInstanceOf(Error);
			expect(result1.error.message).toBe('division by zero');
		}

		const result2 = division(2, 1);
		if (result2.is_err) return;
		expect(result2.value).toBe(2);
	});

	it('should handle async operations with both success and error cases', async () => {
		const throwable = async (enabled: boolean) => {
			if (enabled) throw new Error('message');
			return 1;
		};

		const result1 = await safe(throwable(true));
		if (result1.is_err) {
			expect(result1.error).toBeInstanceOf(Error);
			expect(result1.error.message).toBe('message');
		}

		const result2 = await safe(throwable(false));
		if (result2.is_err) return;
		expect(result2.value).toBe(1);
	});
}
