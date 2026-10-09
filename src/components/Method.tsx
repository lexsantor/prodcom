import { CORE_FEATURES, ADMIN_FEATURES } from '../data/products.ts'
import { AREAS, AREA_LABEL, CURVE_SCORE, SUPPORT_SCORE, WEIGHTS, type Area } from '../lib/score.ts'

const HOW: Record<Area, string> = {
  capability: `Share of the ${CORE_FEATURES.length} core features included. A limited feature counts as half.`,
  value: 'Capability per dollar per person at your team size, compared with the best value in the whole catalogue. Square-root scaled, so the cheapest tool cannot win on price alone.',
  ease: `Learning curve: gentle ${CURVE_SCORE.gentle}, moderate ${CURVE_SCORE.moderate}, steep ${CURVE_SCORE.steep}.`,
  rating: 'The demo user rating, mapped from 3.0 (0 points) to 5.0 (100 points).',
  admin: `Share of the ${ADMIN_FEATURES.length} admin and security controls included. A limited control counts as half.`,
  support: `Support tier: basic ${SUPPORT_SCORE.basic}, standard ${SUPPORT_SCORE.standard}, priority ${SUPPORT_SCORE.priority}, 24/7 premium ${SUPPORT_SCORE.premium}.`,
}

export function Method() {
  return (
    <section className="method" id="method" aria-labelledby="method-title">
      <div className="wrap method-grid">
        <div>
          <h2 id="method-title">How the Prodcom score works</h2>
          <p>
            Every product gets a score out of 100 for your team size. It is a weighted sum of six areas.
            The weights are fixed and the same for everyone, so the same products and team size always give the same verdict.
          </p>
          <p>
            Products that cannot serve your team (because of a seat limit) get no value points and are left out of the verdict.
            Equal scores are decided by user rating, then lower price, then name.
          </p>
          <p>
            The score ranks overall balance. It does not know your workflow, which is why the head-to-head lists where each
            of the other products is stronger, and shows every attribute it is built from.
          </p>
          <p>
            <strong>How Prodcom is paid.</strong> Visit links are affiliate links: Prodcom may earn a commission if you sign up.
            Commission is not an input to the score, and every product is scored and listed the same way whether or not it pays.
          </p>
          <p className="method-data">
            <strong>About the data.</strong> All ten products, and every price, rating, review count and feature, are fictional,
            invented for this demonstration. No rating or review comes from a real customer.
          </p>
        </div>
        <table className="weights">
          <caption className="sr-only">Score areas, their weights and how each is measured</caption>
          <thead>
            <tr><th scope="col">Area</th><th scope="col" className="w-num">Weight</th><th scope="col">How it is measured</th></tr>
          </thead>
          <tbody>
            {AREAS.map((a) => (
              <tr key={a}>
                <th scope="row">{AREA_LABEL[a]}</th>
                <td className="w-num"><span className="num">{WEIGHTS[a]}%</span></td>
                <td>{HOW[a]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
