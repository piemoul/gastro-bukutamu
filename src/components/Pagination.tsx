"use client";

export function Pagination({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
  id = "guests",
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  id?: string;
}) {
  if (!total) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pages);
  const first = Math.max(1, Math.min(current - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => first + index,
  );
  return (
    <nav className="workspace-pagination" aria-label="Halaman daftar tamu">
      <div className="pagination-info">
        <span>
          Menampilkan {(current - 1) * pageSize + 1}–
          {Math.min(current * pageSize, total)} dari {total} tamu
        </span>
        <label htmlFor={`${id}-page-size`}>
          Tamu per halaman
          <select
            id={`${id}-page-size`}
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn-secondary pagination-previous"
          disabled={current === 1}
          onClick={() => onPage(current - 1)}
          aria-label="Halaman sebelumnya"
        >
          Sebelumnya
        </button>
        <div className="pagination-numbers">
          {numbers.map((number) => (
            <button
              type="button"
              key={number}
              aria-label={`Halaman ${number}`}
              aria-current={number === current ? "page" : undefined}
              onClick={() => onPage(number)}
            >
              {number}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary pagination-next"
          disabled={current === pages}
          onClick={() => onPage(current + 1)}
          aria-label="Halaman berikutnya"
        >
          Berikutnya
        </button>
      </div>
    </nav>
  );
}
