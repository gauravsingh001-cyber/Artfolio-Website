import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";

type Artwork = {
  id: number;
  title: string;
  place_of_origin?: string | null;
  artist_display?: string | null;
  inscriptions?: string | null;
  date_start?: number | null;
  date_end?: number | null;
};

const API_BASE = "https://api.artic.edu/api/v1/artworks";
const PAGE_SIZE = 10;
const PAGE_LINKS = 4;

export default function App(): JSX.Element {
  const [rows, setRows] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [page, setPage] = useState<number>(1); // 1-based api page

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPageSelection, setCurrentPageSelection] = useState<Artwork[]>([]);

  const opRef = useRef<any>(null);
  const [selectCount, setSelectCount] = useState<number | null>(1);


  useEffect(() => {
    fetchPage(1);
   
  }, []);

  async function fetchPage(pageNum: number) {
    setLoading(true);
    try {
      console.info("Fetching page:", pageNum);
      const res = await axios.get(API_BASE, { params: { page: pageNum, limit: PAGE_SIZE } });
      const data = res.data?.data ?? [];
   
      const meta = res.data?.meta;
      const paginationTotal =
        meta?.pagination?.total ??
        res.data?.pagination?.total ??
        res.data?.total ?? 
        0;

     
      const artworks: Artwork[] = (data as any[]).map((d) => ({
        id: d.id,
        title: d.title,
        place_of_origin: d.place_of_origin ?? null,
        artist_display: d.artist_display ?? null,
        inscriptions: d.inscriptions ?? null,
        date_start: d.date_start ?? null,
        date_end: d.date_end ?? null,
      }));

      setRows(artworks);
      setTotalRecords(paginationTotal);

     
      const selectedOnPage = artworks.filter((a) => selectedIds.has(a.id));
      setCurrentPageSelection(selectedOnPage);

      console.info("Fetched:", artworks.length, "rows; totalRecords read:", paginationTotal);
    } catch (err) {
      console.error("fetch error", err);
    } finally {
      setLoading(false);
    }
  }

 
  function onSelectionChangeForPage(newSelection: Artwork[]) {
    setCurrentPageSelection(newSelection);

    setSelectedIds((prev) => {
      const copy = new Set(prev);
      rows.forEach((r) => copy.delete(r.id));
      newSelection.forEach((s) => copy.add(s.id));
      return copy;
    });
  }

  function selectAllOnCurrentPage() {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      rows.forEach((r) => copy.add(r.id));
      return copy;
    });
    setCurrentPageSelection(rows);
  }

  function deselectAllOnCurrentPage() {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      rows.forEach((r) => copy.delete(r.id));
      return copy;
    });
    setCurrentPageSelection([]);
  }

  function applyCustomSelect(n: number | null) {
    if (!n || n <= 0) return;
    const clamped = Math.min(n, rows.length);
    const toSelect = rows.slice(0, clamped);

    setSelectedIds((prev) => {
      const copy = new Set(prev);
      toSelect.forEach((r) => copy.add(r.id));
      return copy;
    });

    setCurrentPageSelection(toSelect);
    opRef.current?.hide?.();
  }

 
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  function goToPage(n: number) {
    const next = Math.max(1, Math.min(totalPages, n));
    console.log("goToPage -> requested:", n, "normalized:", next, "current page:", page, "totalPages:", totalPages);
    if (next === page) {
     
      fetchPage(next);
      return;
    }
    setPage(next);
    fetchPage(next);
  }

  function getPageWindow(): number[] {
    const half = Math.floor(PAGE_LINKS / 2);
    let start = Math.max(1, page - half);
    let end = start + PAGE_LINKS - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - PAGE_LINKS + 1);
    }
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  const titleBody = (row: Artwork) => <div>{row.title}</div>;
  const placeBody = (row: Artwork) => <div>{row.place_of_origin ?? "-"}</div>;
  const artistBody = (row: Artwork) => <div style={{ whiteSpace: "pre-wrap" }}>{row.artist_display ?? "-"}</div>;
  const inscriptionsBody = (row: Artwork) => <div style={{ whiteSpace: "pre-wrap" }}>{row.inscriptions ?? "-"}</div>;
  const datesBody = (row: Artwork) => (
    <div>{row.date_start ?? "-"}{row.date_end ? ` — ${row.date_end}` : ""}</div>
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 1200 }}>
        <h2 style={{ textAlign: "center", marginBottom: 12 }}>Art Institute — Artworks</h2>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button label="Select all on page" onClick={selectAllOnCurrentPage} />
            <Button label="Deselect all on page" className="p-button-secondary" onClick={deselectAllOnCurrentPage} />
          </div>

          <div>
            <Button icon="pi pi-filter" label="Custom select" className="p-button-text" onClick={(e) => opRef.current?.toggle?.(e)} />
            <OverlayPanel ref={opRef} showCloseIcon className="custom-select-panel">
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Select first n rows on this page</label>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <InputNumber value={selectCount ?? undefined} onValueChange={(e: any) => setSelectCount(e.value ?? null)} showButtons mode="decimal" min={1} max={PAGE_SIZE} />
                </div>

                <div className="overlay-actions" style={{ marginTop: 12 }}>
                  <Button label="Apply" onClick={() => applyCustomSelect(selectCount)} />
                  <Button label="Close" className="p-button-text" onClick={() => opRef.current?.hide?.()} />
                </div>
              </div>
            </OverlayPanel>
          </div>
        </div>

        <div className="card">
          <DataTable
            value={rows}
            lazy
            paginator={false}
            loading={loading}
            selection={currentPageSelection}
            onSelectionChange={(e: { value: Artwork[] }) => onSelectionChangeForPage(e.value)}
            dataKey="id"
            showGridlines
            responsiveLayout="scroll"
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column field="title" header="Title" body={titleBody} />
            <Column field="place_of_origin" header="Place of Origin" body={placeBody} />
            <Column field="artist_display" header="Artist" body={artistBody} />
            <Column field="inscriptions" header="Inscriptions" body={inscriptionsBody} />
            <Column header="Dates" body={datesBody} />
          </DataTable>

          <div className="bottom-bar" style={{ marginTop: 12 }}>
            <div style={{ paddingLeft: 12 }}>Selected IDs: {selectedIds.size}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="pager-btn" onClick={() => goToPage(1)} disabled={page === 1}>««</button>
              <button className="pager-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>‹</button>

              {getPageWindow().map((p) => (
                <button
                  key={p}
                  className={`pager-btn page-number ${p === page ? "active" : ""}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}

              <button className="pager-btn" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>›</button>
              <button className="pager-btn" onClick={() => goToPage(totalPages)} disabled={page === totalPages}>»»</button>
            </div>
          </div>

          
          <div style={{ marginTop: 8, color: "#555", fontSize: 13 }}>
            <strong>Debug:</strong> page={page}, totalRecords={totalRecords}, totalPages={totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}
