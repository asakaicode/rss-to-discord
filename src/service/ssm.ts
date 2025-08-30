import { GetParameterCommand, Parameter, SSMClient } from '@aws-sdk/client-ssm'

enum SSM_PARAMETER_TYPE {
  STRING = 'String',
  STRING_LIST = 'StringList',
  SECURE_STRING = 'SecureString',
}

export class SSMService extends SSMClient {
  constructor() {
    super()
  }

  public async fetchParameter(name: string): Promise<string | string[]> {
    const result = await this.send(
      new GetParameterCommand({
        Name: name,
        WithDecryption: true,
      }),
    )

    if (
      !result.$metadata.httpStatusCode ||
      result.$metadata.httpStatusCode >= 400
    ) {
      throw new Error(`Parameter ${name} not found`)
    }

    return this.parseParameter(result.Parameter)
  }

  public async fetchParameters(
    names: string[],
  ): Promise<Record<string, string | string[]>> {
    const wrapped = names.map((name) =>
      this.fetchParameter(name)
        .then((value) => ({ name, value }))
        .catch(() => ({ name, value: '' })),
    )

    const results = await Promise.all(wrapped)

    return results.reduce<Record<string, string | string[]>>((acc, result) => {
      acc[result.name] = result.value
      return acc
    }, {})
  }

  private parseParameter(parameter?: Parameter): string | string[] {
    switch (parameter?.Type) {
      case SSM_PARAMETER_TYPE.STRING:
      case SSM_PARAMETER_TYPE.SECURE_STRING:
        return parameter.Value || ''
      case SSM_PARAMETER_TYPE.STRING_LIST:
        return parameter.Value?.split(',') || []
      default:
        return ''
    }
  }
}
