import { NumericFormat, PatternFormat } from 'react-number-format'

const ReactInputMask = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h4 className="card-title mb-1.5">Form Inputmask</h4>
        <p className="text-default-400">Inputmask is a javascript library that creates an input mask. Inputmask can run against vanilla javascript, jQuery, and jqlite. (Hoverable Inputmask)</p>
      </div>

      <div className="card-body">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Date</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;00/00/0000&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="##/##/####" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Hour</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;00:00:00&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="##:##:##" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Date & Hour</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;00/00/0000 00:00:00&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="##/##/#### ##:##:##" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">ZIP Code</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;00000-000&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="#####-###" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Crazy ZIP Code</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;0-00-00-00&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="#-##-##-##" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Money</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;000.000.000.000.000,00&quot;</code>,<code>data-reverse=&quot;true&quot;</code>
            </p>
          </div>
          <NumericFormat className="form-input" thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale allowNegative={false} />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Money 2</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;#.##0,00&quot;</code>,<code>data-reverse=&quot;true&quot;</code>
            </p>
          </div>
          <NumericFormat className="form-input" thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale prefix="$" allowNegative={false} />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Telephone</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;0000-0000&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="####-####" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">Telephone with Area Code</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;(00) 0000-0000&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="(##) ####-####" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">US Telephone</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;(000) 000-0000&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="(###) ###-####" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">São Paulo Cellphones</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;(00) 00000-0000&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="(##) #####-####" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">CPF</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;000.000.000-00&quot;</code>,<code>data-reverse=&quot;true&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="###.###.###-##" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">CNPJ</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;00.000.000/0000-00&quot;</code>,<code>data-reverse=&quot;true&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="##.###.###/####-##" mask="_" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <div>
            <h5 className="mb-2">IP Address</h5>
            <p className="text-default-400">
              Add attribute&nbsp;
              <code>data-toggle=&quot;input-mask&quot;</code>
              <code>data-mask-format=&quot;099.099.099.099&quot;</code>,<code>data-reverse=&quot;true&quot;</code>
            </p>
          </div>
          <PatternFormat className="form-input" format="###.###.###.###" mask="_" />
        </div>
      </div>
    </div>
  )
}

export default ReactInputMask
