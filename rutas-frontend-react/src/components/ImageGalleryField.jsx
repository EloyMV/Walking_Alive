import { useState } from 'react';
import { isHttpImageUrl, normalizeImageUrls } from '../utils/imageUrls';

export default function ImageGalleryField({
  value,
  onChange,
  disabled = false,
  error,
  label = 'Galería de imágenes'
}) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const [failedUrls, setFailedUrls] = useState({});
  const urls = normalizeImageUrls(value);

  function changeUrl(index, url) {
    onChange(urls.map((current, position) => position === index ? url : current));
  }

  function removeImage(index) {
    setFailedUrls((current) => Object.fromEntries(
      Object.entries(current)
        .filter(([position]) => Number(position) !== index)
        .map(([position, failedUrl]) => [Number(position) > index ? Number(position) - 1 : Number(position), failedUrl])
    ));
    onChange(urls.filter((_, position) => position !== index));
  }

  function addImage(event) {
    event.preventDefault();
    const url = draft.trim();
    if (!isHttpImageUrl(url)) {
      setDraftError('Introduce una URL válida que empiece por http:// o https://.');
      return;
    }
    onChange([...urls, url]);
    setDraft('');
    setDraftError('');
  }

  return (
    <fieldset className="image-gallery full-width" disabled={disabled}>
      <legend>{label}</legend>
      <p className="muted">Añade imágenes con URLs directas. Los cambios se guardan al enviar el formulario.</p>
      {urls.length > 0 ? (
        <div className="image-gallery-grid">
          {urls.map((url, index) => {
            const invalid = url.length > 0 && !isHttpImageUrl(url);
            return (
              <article className="image-gallery-item" key={index}>
                <div className="image-gallery-preview">
                  {isHttpImageUrl(url)
                    ? <img
                      src={url}
                      alt={`Previsualización de imagen ${index + 1}`}
                      onError={() => setFailedUrls((current) => ({ ...current, [index]: url }))}
                      onLoad={() => setFailedUrls((current) => {
                        if (current[index] !== url) return current;
                        const next = { ...current };
                        delete next[index];
                        return next;
                      })}
                    />
                    : null}
                  <span className="image-gallery-failed" hidden={!isHttpImageUrl(url) || failedUrls[index] !== url}>
                    No se pudo cargar la previsualización. La URL se conservará.
                  </span>
                  {!isHttpImageUrl(url) && <span className="image-gallery-failed">Introduce una URL HTTP o HTTPS.</span>}
                </div>
                <label className="image-gallery-url">
                  <span>URL de imagen {index + 1}</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(event) => changeUrl(index, event.target.value)}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `gallery-url-error-${index}` : undefined}
                    placeholder="https://images.unsplash.com/..."
                  />
                </label>
                {invalid && <small id={`gallery-url-error-${index}`} className="field-error">Usa una URL HTTP o HTTPS válida.</small>}
                <button type="button" className="button button-danger button-small" onClick={() => removeImage(index)}>
                  Quitar imagen {index + 1}
                </button>
              </article>
            );
          })}
        </div>
      ) : <p className="image-gallery-empty">Todavía no hay imágenes. Añade una URL para crear la galería.</p>}

      <div className="image-gallery-add">
        <label>
          <span>Añadir imagen por URL</span>
          <input
            type="url"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setDraftError('');
            }}
            placeholder="https://images.unsplash.com/..."
            aria-invalid={Boolean(draftError)}
            aria-describedby={draftError ? 'gallery-draft-error' : undefined}
          />
        </label>
        <button type="button" className="button button-secondary" disabled={!draft.trim()} onClick={addImage}>Añadir imagen</button>
      </div>
      {draftError && <small id="gallery-draft-error" className="field-error" role="alert">{draftError}</small>}
      {error && <small className="field-error" role="alert">{error}</small>}
      {urls.length > 0 && <button type="button" className="button button-ghost button-small image-gallery-clear" onClick={() => onChange([])}>Quitar todas las imágenes</button>}
    </fieldset>
  );
}
